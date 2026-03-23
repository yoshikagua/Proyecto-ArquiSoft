import sys
from pathlib import Path
from unittest.mock import patch
import unittest
import importlib

from fastapi.testclient import TestClient
import httpx

ROOT = Path(__file__).resolve().parents[1]
API_GATEWAY_DIR = ROOT / "api-gateway"
if str(API_GATEWAY_DIR) not in sys.path:
    sys.path.insert(0, str(API_GATEWAY_DIR))

app = importlib.import_module("app.main").app


class _FakeResponse:
    def __init__(self, status_code: int, payload: dict):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


class _FakeAsyncClient:
    last_call = None
    next_response = _FakeResponse(200, {"ok": True})
    should_raise = False

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, url, json, timeout):
        _FakeAsyncClient.last_call = {
            "url": url,
            "json": json,
            "timeout": timeout,
        }
        if _FakeAsyncClient.should_raise:
            raise httpx.RequestError("connection error")
        return _FakeAsyncClient.next_response


class GatewayUserApiConnectionTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        _FakeAsyncClient.last_call = None
        _FakeAsyncClient.should_raise = False
        _FakeAsyncClient.next_response = _FakeResponse(200, {"ok": True})

    def test_health_reports_configured_targets(self):
        response = self.client.get("/api/auth/health")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "ok")
        self.assertIn("user_api", body)
        self.assertIn("frontend", body)

    def test_login_proxies_to_auth_login_path(self):
        with patch("app.routers.auth.httpx.AsyncClient", _FakeAsyncClient):
            response = self.client.post(
                "/api/auth/login",
                json={"email": "user@test.com", "password": "123456"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(_FakeAsyncClient.last_call)
        self.assertTrue(_FakeAsyncClient.last_call["url"].endswith("/auth/login"))
        self.assertEqual(
            _FakeAsyncClient.last_call["json"],
            {"email": "user@test.com", "password": "123456"},
        )

    def test_signup_maps_name_to_first_and_last_name(self):
        with patch("app.routers.auth.httpx.AsyncClient", _FakeAsyncClient):
            response = self.client.post(
                "/api/auth/signup",
                json={
                    "email": "new@test.com",
                    "password": "123456",
                    "name": "Ada Lovelace",
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(_FakeAsyncClient.last_call["url"].endswith("/auth/register"))
        self.assertEqual(
            _FakeAsyncClient.last_call["json"],
            {
                "email": "new@test.com",
                "password": "123456",
                "first_name": "Ada",
                "last_name": "Lovelace",
                "role_id": None,
            },
        )

    def test_signup_uses_explicit_first_last_name(self):
        with patch("app.routers.auth.httpx.AsyncClient", _FakeAsyncClient):
            response = self.client.post(
                "/api/auth/signup",
                json={
                    "email": "new@test.com",
                    "password": "123456",
                    "first_name": "Alan",
                    "last_name": "Turing",
                    "role_id": 1,
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            _FakeAsyncClient.last_call["json"],
            {
                "email": "new@test.com",
                "password": "123456",
                "first_name": "Alan",
                "last_name": "Turing",
                "role_id": 1,
            },
        )

    def test_login_returns_503_when_user_api_unreachable(self):
        _FakeAsyncClient.should_raise = True
        with patch("app.routers.auth.httpx.AsyncClient", _FakeAsyncClient):
            response = self.client.post(
                "/api/auth/login",
                json={"email": "user@test.com", "password": "123456"},
            )

        self.assertEqual(response.status_code, 503)


if __name__ == "__main__":
    unittest.main()
