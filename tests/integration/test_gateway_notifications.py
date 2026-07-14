import sys
from pathlib import Path
from unittest.mock import patch
import unittest
import importlib
from fastapi.testclient import TestClient
import httpx

ROOT = Path(__file__).resolve().parents[2]
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
    next_response = _FakeResponse(200, {"status": "ok"})
    should_raise = False

    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self): return self
    async def __aexit__(self, exc_type, exc, tb): return False

    async def get(self, url, timeout=None):
        _FakeAsyncClient.last_call = {"method": "GET", "url": url}
        if _FakeAsyncClient.should_raise: raise httpx.RequestError("error")
        return _FakeAsyncClient.next_response

    async def post(self, url, json=None, timeout=None):
        _FakeAsyncClient.last_call = {"method": "POST", "url": url, "json": json}
        if _FakeAsyncClient.should_raise: raise httpx.RequestError("error")
        return _FakeAsyncClient.next_response

class GatewayNotificationsConnectionTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        _FakeAsyncClient.last_call = None
        _FakeAsyncClient.should_raise = False

    def test_notification_health_proxy(self):
        """Valida que el gateway consulte la salud del productor de notificaciones"""
        with patch.object(httpx, "AsyncClient", _FakeAsyncClient):
            response = self.client.get("/api/notifications/health")
            
        self.assertEqual(response.status_code, 200)
        self.assertIn("notification-producer", _FakeAsyncClient.last_call["url"])
        self.assertEqual(response.json()["notification_service"], "online")

    def test_notification_send_proxy(self):
        """Valida que el envío de notificaciones se redirija correctamente"""
        payload = {"email": "test@test.com", "asunto": "Hola", "mensaje": "Mundo"}
        with patch.object(httpx, "AsyncClient", _FakeAsyncClient):
            response = self.client.post("/api/notifications/send", json=payload)
            
        self.assertEqual(response.status_code, 200)
        self.assertEqual(_FakeAsyncClient.last_call["method"], "POST")
        self.assertEqual(_FakeAsyncClient.last_call["json"], payload)

if __name__ == "__main__":
    unittest.main()
