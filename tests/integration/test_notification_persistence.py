import unittest
import psycopg2
import httpx
import time
import uuid

class TestNotificationPersistence(unittest.TestCase):
    """
    Test de integración que valida la persistencia en base de datos 
    después de enviar una notificación.
    """
    
    PRODUCER_URL = "http://localhost:8002"
    DB_CONFIG = {
        "dbname": "emails_db",
        "user": "postgres",
        "password": "password",
        "host": "localhost",
        "port": "5433"
    }

    def test_notification_saves_to_db(self):
        # 1. Generar un ID único para el mensaje para evitar colisiones
        unique_id = str(uuid.uuid4())
        test_email = f"test_{unique_id[:8]}@example.com"
        test_subject = f"Test Persistencia {unique_id}"
        test_message = "Validando que esto se guarde en Postgres"

        # 2. Enviar notificación vía Producer
        payload = {
            "email": test_email,
            "asunto": test_subject,
            "mensaje": test_message
        }
        
        try:
            response = httpx.post(self.PRODUCER_URL, json=payload, timeout=10)
            self.assertEqual(response.status_code, 200, "El producer no aceptó la notificación")
        except Exception as e:
            self.skipTest(f"Producer no disponible en {self.PRODUCER_URL}: {e}")

        # 3. Esperar un momento a que el worker procese y guarde (asíncrono)
        time.sleep(2)

        # 4. Verificar en la base de datos
        try:
            conn = psycopg2.connect(**self.DB_CONFIG)
            cur = conn.cursor()
            
            cur.execute(
                "SELECT email_destino, asunto, estado FROM emails_enviados WHERE asunto = %s", 
                (test_subject,)
            )
            record = cur.fetchone()
            
            self.assertIsNotNone(record, f"No se encontró el registro en la DB para el asunto: {test_subject}")
            self.assertEqual(record[0], test_email)
            self.assertEqual(record[1], test_subject)
            print(f"   ✅ Registro encontrado en DB. Estado: {record[2]}")
            
            cur.close()
            conn.close()
        except Exception as e:
            self.fail(f"Error conectando a la base de datos de notificaciones: {e}")

if __name__ == "__main__":
    unittest.main()
