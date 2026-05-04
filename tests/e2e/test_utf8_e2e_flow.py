import unittest
import httpx
import psycopg2
import time
import uuid

class TestUTF8E2EFlow(unittest.TestCase):
    """
    Test E2E que valida que los caracteres especiales (UTF-8) 
    se preserven en todo el flujo:
    Gateway -> Auth API -> Notification Producer -> Worker -> DB
    """
    
    GATEWAY_URL = "http://localhost:8000"
    DB_CONFIG = {
        "dbname": "emails_db",
        "user": "postgres",
        "password": "password",
        "host": "localhost",
        "port": "5433"
    }

    def test_registration_with_special_characters(self):
        unique_id = str(uuid.uuid4())[:8]
        # Nombre con tildes y eñes
        special_name = f"Niña Pérez {unique_id}"
        test_email = f"user_{unique_id}@example.com"
        
        payload = {
            "email": test_email,
            "password": "Password123!",
            "name": special_name
        }

        print(f"\n   🚀 Registrando usuario con nombre: {special_name}")
        
        # 1. Enviar registro al Gateway
        try:
            response = httpx.post(
                f"{self.GATEWAY_URL}/api/auth/signup", 
                json=payload, 
                timeout=15
            )
            self.assertIn(response.status_code, [201, 200])
            
            # Verificar que la respuesta del gateway no tenga caracteres rotos
            resp_data = response.json()
            print(f"   ✅ Respuesta del Gateway: {resp_data.get('message', 'Sin mensaje')}")
            
        except Exception as e:
            self.skipTest(f"Servicios no disponibles para E2E: {e}")

        # 2. Esperar procesamiento asíncrono
        print("   ⏳ Esperando procesamiento de notificación...")
        time.sleep(3)

        # 3. Verificar en DB de notificaciones que el nombre se guardó bien
        try:
            conn = psycopg2.connect(**self.DB_CONFIG)
            cur = conn.cursor()
            
            # El mensaje de bienvenida contiene el nombre del usuario
            cur.execute(
                "SELECT mensaje FROM emails_enviados WHERE email_destino = %s ORDER BY fecha_envio DESC LIMIT 1", 
                (test_email,)
            )
            record = cur.fetchone()
            
            self.assertIsNotNone(record, "No se encontró log de email en la DB")
            mensaje_db = record[0]
            
            print(f"   🔍 Contenido recuperado de DB: {mensaje_db[:50]}...")
            
            # Verificar presencia de caracteres especiales
            self.assertIn("Niña Pérez", mensaje_db, "Los caracteres especiales se corrompieron en el flujo")
            print("   ✅ Caracteres UTF-8 (ñ, é) verificados exitosamente en la base de datos.")
            
            cur.close()
            conn.close()
        except Exception as e:
            self.fail(f"Fallo en la verificación de persistencia UTF-8: {e}")

if __name__ == "__main__":
    unittest.main()
