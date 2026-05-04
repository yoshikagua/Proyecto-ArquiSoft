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
        self.headers = httpx.Headers({"content-type": "application/json"})
        self.content = b'{"ok": true}' if not payload else str(payload).encode()

    def json(self):
        return self._payload

class _FakeAsyncClient:
    last_call = None
    next_response = _FakeResponse(200, {"status": "ok"})
    should_raise = False

    async def __aenter__(self): return self
    async def __aexit__(self, exc_type, exc, tb): return False

    async def get(self, url, timeout=None):
        _FakeAsyncClient.last_call = {"method": "GET", "url": url}
        if _FakeAsyncClient.should_raise: raise httpx.RequestError("error")
        return _FakeAsyncClient.next_response

    async def post(self, url, json=None, files=None, headers=None, timeout=None):
        _FakeAsyncClient.last_call = {"method": "POST", "url": url, "json": json, "files": files}
        if _FakeAsyncClient.should_raise: raise httpx.RequestError("error")
        return _FakeAsyncClient.next_response

class GatewayStorageConnectionTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        _FakeAsyncClient.last_call = None
        _FakeAsyncClient.should_raise = False
        _FakeAsyncClient.next_response = _FakeResponse(200, {"status": "ok"})

    def test_storage_health_checks_internal_services(self):
        """Valida que el health check de storage consulte a metadata y files APIs"""
        with patch("app.routers.storage.httpx.AsyncClient", _FakeAsyncClient):
            response = self.client.get("/api/storage/health")
            
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")
        # El gateway hace múltiples llamadas, el fake guardará la última (files-api)
        self.assertIn("files-api", _FakeAsyncClient.last_call["url"])

    def test_graphql_proxy_forwarding(self):
        """Valida que las peticiones a la raíz de /api/storage se redirijan a metadata-api"""
        with patch("app.routers.storage.httpx.AsyncClient", _FakeAsyncClient):
            query = {"query": "{ scores { id } }"}
            response = self.client.post("/api/storage/", json=query)
            
        self.assertEqual(response.status_code, 200)
        self.assertEqual(_FakeAsyncClient.last_call["url"], "http://metadata-api:8000/storage")
        self.assertEqual(_FakeAsyncClient.last_call["json"], query)

    def test_storage_returns_503_on_internal_error(self):
        """Valida manejo de error 503 cuando los servicios internos no responden"""
        _FakeAsyncClient.should_raise = True
        with patch("app.routers.storage.httpx.AsyncClient", _FakeAsyncClient):
            response = self.client.get("/api/storage/health")
        
        self.assertEqual(response.status_code, 503)

if __name__ == "__main__":
    unittest.main()
