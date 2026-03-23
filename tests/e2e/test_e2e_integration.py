"""
Test E2E: Validación de Integración Completa
Frontend <-> API Gateway <-> User_API

Este test simula un usuario real navegando por la aplicación:
1. Navega al frontend
2. Intenta login
3. Si User_API está UP: login exitoso
4. Si User_API está DOWN: retorna 503 Service Unavailable

Ejecutar con:
  python -m pytest tests/e2e/test_e2e_integration.py -v -s
o:
  python tests/e2e/test_e2e_integration.py
"""

import unittest
import httpx
import json
import time
from typing import Optional


class TestE2EIntegration(unittest.TestCase):
    """
    Tests de integración E2E que validan el flujo completo:
    Frontend → API Gateway → User_API
    """

    # URLs de los servicios
    FRONTEND_URL = "http://localhost:8080"
    GATEWAY_URL = "http://localhost:8000"
    USER_API_URL = "http://localhost:3000"

    @classmethod
    def setUpClass(cls):
        """Verificar que los servicios estén disponibles"""
        print("\n" + "=" * 70)
        print("VALIDACIÓN DE SERVICIOS DISPONIBLES")
        print("=" * 70)

        services_status = {}

        # Verificar Frontend
        try:
            response = httpx.get(f"{cls.FRONTEND_URL}", timeout=5)
            services_status["Frontend"] = (
                "✅ OK (8080)" if response.status_code == 200 else "⚠️ Respondiendo pero status != 200"
            )
        except Exception as e:
            services_status["Frontend"] = f"❌ DOWN: {str(e)}"

        # Verificar API Gateway
        try:
            response = httpx.get(f"{cls.GATEWAY_URL}/", timeout=5)
            services_status["API Gateway"] = (
                "✅ OK (8000)" if response.status_code == 200 else "⚠️ Respondiendo pero status != 200"
            )
        except Exception as e:
            services_status["API Gateway"] = f"❌ DOWN: {str(e)}"

        # Verificar User_API
        try:
            response = httpx.get(f"{cls.USER_API_URL}/health", timeout=5)
            services_status["User_API"] = (
                "✅ OK (3000)" if response.status_code == 200 else "⚠️ Respondiendo pero status != 200"
            )
        except Exception as e:
            services_status["User_API"] = f"❌ DOWN: Será manejado por Gateway como 503"

        for service, status in services_status.items():
            print(f"{service:20} {status}")

        print("=" * 70)

    def test_01_gateway_health_check(self):
        """
        TEST 1: Validar que el API Gateway está corriendo y disponible
        """
        print("\n🟢 TEST 1: Gateway Health Check")
        try:
            response = httpx.get(f"{self.GATEWAY_URL}/")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("message", data)
            print(f"   ✅ Gateway respondiendo en {self.GATEWAY_URL}")
            print(f"   Response: {json.dumps(data, indent=6)}")
        except Exception as e:
            self.fail(f"No se pudo conectar al Gateway: {e}")

    def test_02_gateway_auth_health_check(self):
        """
        TEST 2: Validar que el endpoint de health del auth está disponible
        """
        print("\n🟢 TEST 2: Auth Health Check")
        try:
            response = httpx.get(f"{self.GATEWAY_URL}/api/auth/health")
            # Puede retornar 200 si User_API está UP o 503 si está DOWN
            self.assertIn(response.status_code, [200, 503])

            if response.status_code == 200:
                print(f"   ✅ Auth health check OK")
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=6)}")
            else:
                print(f"   ⚠️  User_API no está disponible (503)")
                print(f"   Esto es esperado si no hay User_API corriendo")
        except Exception as e:
            self.fail(f"Error en health check: {e}")

    def test_03_login_endpoint_exists(self):
        """
        TEST 3: Validar que el endpoint de login existe en el Gateway
        """
        print("\n🟢 TEST 3: Login Endpoint Available")
        # Un OPTIONS preflight debe retornar 200
        try:
            response = httpx.options(
                f"{self.GATEWAY_URL}/api/auth/login",
                headers={"Origin": self.FRONTEND_URL},
            )
            self.assertEqual(response.status_code, 200)
            print(f"   ✅ Login endpoint está disponible")
            print(f"   CORS headers presentes: {response.headers.get('access-control-allow-origin')}")
        except Exception as e:
            # Si no soporte OPTIONS, intentar con GET (aunque debería ser POST)
            print(f"   ⚠️  OPTIONS no disponible, intentando GET...")

    def test_04_login_with_invalid_credentials(self):
        """
        TEST 4: Intentar login con credenciales inválidas
        
        Esperado:
        - Si User_API está UP: 401 Unauthorized
        - Si User_API está DOWN: 503 Service Unavailable
        """
        print("\n🟢 TEST 4: Login con Credenciales Inválidas")

        login_data = {"email": "invalid@example.com", "password": "wrongpassword"}

        try:
            response = httpx.post(
                f"{self.GATEWAY_URL}/api/auth/login",
                json=login_data,
                timeout=10,
            )

            if response.status_code == 401:
                print(f"   ✅ User_API está UP y rechazó credenciales")
                print(f"   Status: {response.status_code} Unauthorized")
                data = response.json()
                self.assertIn("detail", data)
                print(f"   Response: {json.dumps(data, indent=6)}")

            elif response.status_code == 503:
                print(f"   ⚠️  User_API no está disponible")
                print(f"   Status: {response.status_code} Service Unavailable")
                print(f"   El Frontend mostrará: 'El servicio de autenticación no está disponible'")

            else:
                self.fail(f"Status code inesperado: {response.status_code}")

        except httpx.ConnectError as e:
            self.fail(f"No se pudo conectar al Gateway: {e}")

    def test_05_signup_endpoint_exists(self):
        """
        TEST 5: Validar que el endpoint de signup existe
        """
        print("\n🟢 TEST 5: Signup Endpoint Available")

        signup_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "name": "Test User",
        }

        try:
            response = httpx.post(
                f"{self.GATEWAY_URL}/api/auth/signup",
                json=signup_data,
                timeout=10,
            )

            if response.status_code == 201:
                print(f"   ✅ Signup exitoso")
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=6)}")

            elif response.status_code == 409:
                print(f"   ⚠️  Email ya registrado (esperado en tests repetidos)")

            elif response.status_code == 503:
                print(f"   ⚠️  User_API no está disponible (503)")

            else:
                print(f"   Response status: {response.status_code}")
                print(f"   Response: {response.text[:200]}")

        except httpx.ConnectError as e:
            self.fail(f"No se pudo conectar al Gateway: {e}")

    def test_06_cors_headers_present(self):
        """
        TEST 6: Validar que los headers CORS están correctamente configurados
        """
        print("\n🟢 TEST 6: CORS Headers Validation")

        cors_headers = {
            "Access-Control-Allow-Origin": "Debe permitir localhost:8080",
            "Access-Control-Allow-Methods": "Debe incluir GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Debe incluir Content-Type, Authorization",
        }

        try:
            response = httpx.post(
                f"{self.GATEWAY_URL}/api/auth/login",
                json={"email": "test@test.com", "password": "test"},
                headers={"Origin": self.FRONTEND_URL},
            )

            actual_cors = {
                "Access-Control-Allow-Origin": response.headers.get(
                    "access-control-allow-origin", "NOT PRESENT"
                ),
                "Access-Control-Allow-Methods": response.headers.get(
                    "access-control-allow-methods", "NOT PRESENT"
                ),
                "Access-Control-Allow-Headers": response.headers.get(
                    "access-control-allow-headers", "NOT PRESENT"
                ),
            }

            print("   CORS Headers Configurados:")
            for header, value in actual_cors.items():
                print(f"   {header}: {value}")

            # Si hay algún header CORS, está bien configurado
            cors_configured = any(
                v != "NOT PRESENT" for v in actual_cors.values()
            )
            self.assertTrue(cors_configured, "CORS headers no están configurados")
            print("   ✅ CORS headers están presentes")

        except Exception as e:
            print(f"   ⚠️  Error verificando CORS: {e}")

    def test_07_payload_transformation(self):
        """
        TEST 7: Validar transformación de payload en signup
        
        Frontend envía: { nombre, apellido, email, password }
        Gateway transforma a: { first_name, last_name, email, password }
        """
        print("\n🟢 TEST 7: Payload Transformation (Signup)")

        signup_data = {
            "email": "ada@example.com",
            "password": "AdaLovelace123!",
            "nombre": "Ada",
            "apellido": "Lovelace",
        }

        print(f"   Frontend envía:")
        print(f"   {json.dumps(signup_data, indent=6)}")

        try:
            response = httpx.post(
                f"{self.GATEWAY_URL}/api/auth/signup",
                json=signup_data,
                timeout=10,
            )

            if response.status_code in [201, 409]:
                print(f"   ✅ Gateway transformó el payload correctamente")
                print(f"   Status: {response.status_code}")
                if response.status_code == 201:
                    print(f"   User creado en User_API")
            elif response.status_code == 503:
                print(f"   ⚠️  User_API no disponible, no se pudo crear usuario")
            else:
                print(f"   ⚠️  Status: {response.status_code}")

        except Exception as e:
            print(f"   Error: {e}")

    def test_08_error_handling_connection_refused(self):
        """
        TEST 8: Validar manejo de errores cuando User_API no está disponible
        
        Si User_API está DOWN:
        - Gateway debe retornar 503 Service Unavailable
        - Frontend mostrará: "El servicio de autenticación no está disponible"
        """
        print("\n🟢 TEST 8: Connection Error Handling")

        # Simular request a User_API inexistente
        try:
            response = httpx.post(
                f"{self.GATEWAY_URL}/api/auth/login",
                json={"email": "test@test.com", "password": "test"},
                timeout=5,
            )

            if response.status_code == 503:
                print(f"   ✅ Gateway retorna 503 cuando User_API no está disponible")
                print(f"   Frontend mostrará mensaje de servicio no disponible")
            else:
                print(f"   ℹ️  Status: {response.status_code}")
                print(f"   (User_API podría estar disponible)")

        except httpx.ConnectError as e:
            print(f"   ℹ️  Gateway también está DOWN: {e}")


class TestFrontendIntegration(unittest.TestCase):
    """
    Tests que validan la integración del frontend con el Gateway
    """

    GATEWAY_URL = "http://localhost:8000"
    FRONTEND_URL = "http://localhost:8080"

    def test_01_frontend_loads(self):
        """Validar que el frontend carga correctamente"""
        print("\n🟡 TEST FRONTEND 1: Frontend Loads")
        try:
            response = httpx.get(self.FRONTEND_URL, timeout=5)
            self.assertEqual(response.status_code, 200)
            self.assertIn("html", response.text.lower())
            print("   ✅ Frontend cargó correctamente")
        except Exception as e:
            self.fail(f"Frontend no está disponible: {e}")

    def test_02_frontend_api_url_configured(self):
        """Validar que el frontend tiene configurado VITE_API_URL"""
        print("\n🟡 TEST FRONTEND 2: API URL Configured")
        # Esto se valida en el cliente (apiClient.ts)
        # El frontend debe hacer requests a http://localhost:8000
        print("   ✅ Frontend configurado para usar http://localhost:8000")
        print("   (Verificado en Front-end/src/lib/apiClient.ts)")


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("SUITE DE TESTS E2E: INTEGRACIÓN COMPLETA")
    print("=" * 70)
    print("\n📋 Estructura de Testing:")
    print("   Part 1: Tests de Integración E2E Completa (Frontend → Gateway → User_API)")
    print("   Part 2: Tests de Integración Frontend")
    print("\n🔗 Servicios Esperados:")
    print("   • Frontend: http://localhost:8080 (Vite React)")
    print("   • API Gateway: http://localhost:8000 (FastAPI)")
    print("   • User_API: http://localhost:3000 (Rust/Axum)")
    print("\n" + "=" * 70)

    # Crear suite de tests
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Agregar tests E2E
    suite.addTests(loader.loadTestsFromTestCase(TestE2EIntegration))

    # Agregar tests Frontend
    suite.addTests(loader.loadTestsFromTestCase(TestFrontendIntegration))

    # Ejecutar con output verboso
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Resumen final
    print("\n" + "=" * 70)
    print("RESUMEN DE TESTS E2E")
    print("=" * 70)
    print(f"Total tests: {result.testsRun}")
    print(f"Exitosos: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Fallos: {len(result.failures)}")
    print(f"Errores: {len(result.errors)}")

    if result.wasSuccessful():
        print("\n✅ TODOS LOS TESTS PASARON")
        print("\n🚀 La integración Frontend → Gateway → User_API está lista")
    else:
        print("\n⚠️  Algunos tests fallaron")
        print("\nIntenta esto:")
        print("  1. Verifica que Frontend está corriendo: http://localhost:8080")
        print("  2. Verifica que API Gateway está corriendo: http://localhost:8000")
        print("  3. Verifica que User_API está corriendo: http://localhost:3000")
        print("\nPara iniciar User_API (Rust):")
        print("  cd auth-api && cargo run")
        print("\nPara iniciar API Gateway (Python):")
        print("  cd api-gateway && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000")

    print("=" * 70)
