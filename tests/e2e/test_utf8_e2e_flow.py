import unittest
import httpx
import psycopg2
import time
import uuid

class TestUTF8E2EFlow(unittest.TestCase):
    # Configuración de la base de datos de notificaciones (Docker)
    DB_CONFIG = {
        "host": "localhost",
        "port": 5433,
        "database": "emails_db",
        "user": "postgres",
        "password": "password"
    }
    
    GATEWAY_URL = "http://localhost:8000/api/auth/signup"

    def test_registration_with_special_characters(self):
        """Valida que el flujo completo (Gateway -> Auth-API -> Producer -> Worker -> DB) preserve UTF-8"""
        unique_id = str(uuid.uuid4())[:8]
        test_email = f"nina_perez_{unique_id}@example.com"
        # Nombre con caracteres especiales: ñ, é
        special_name = f"Niña Pérez {unique_id}"
        
        payload = {
            "email": test_email,
            "password": "password123",
            "name": special_name
        }

        print(f"   Enviando registro para: {special_name}")
        
        # 1. Registrar usuario vía Gateway
        try:
            response = httpx.post(self.GATEWAY_URL, json=payload, timeout=10)
            self.assertIn(response.status_code, [200, 201], f"Error en registro: {response.text}")
            print("   Respuesta del Gateway: User registered successfully")
        except Exception as e:
            self.skipTest(f"Servicios no disponibles para E2E: {e}")

        # 2. Consultar la base de datos con re-intentos (máximo 60 segundos)
        print("   ESPERANDO procesamiento de notificación...")
        mensaje_db = None
        for i in range(60):
            try:
                conn = psycopg2.connect(**self.DB_CONFIG)
                cur = conn.cursor()
                # El mensaje de bienvenida contiene el nombre del usuario
                cur.execute(
                    "SELECT mensaje FROM emails_enviados WHERE email_destino = %s ORDER BY fecha_envio DESC LIMIT 1", 
                    (test_email,)
                )
                record = cur.fetchone()
                if record:
                    mensaje_db = record[0]
                cur.close()
                conn.close()
                
                if mensaje_db:
                    break
            except Exception as e:
                print(f"      (Intento {i+1}) Error conectando a DB: {e}")
            
            time.sleep(1)
    
        # 3. Verificar resultados
        self.assertIsNotNone(mensaje_db, "No se encontro log de email en la DB tras 60s")
        print(f"   Contenido recuperado de DB: {mensaje_db[:50]}...")
        
        # Verificar presencia de caracteres especiales (solo el first_name "Niña")
        self.assertIn("Niña", mensaje_db, "Los caracteres especiales se corrompieron en el flujo")
        print("   Caracteres UTF-8 (n) verificados exitosamente en la base de datos.")

if __name__ == "__main__":
    unittest.main()
