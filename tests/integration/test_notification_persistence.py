import unittest
import httpx
import psycopg2
import time
import uuid
import os
from pathlib import Path

class TestNotificationPersistence(unittest.TestCase):
    # Configuración de la base de datos de notificaciones (Docker)
    DB_CONFIG = {
        "host": "localhost",
        "port": 5433,
        "database": "emails_db",
        "user": "postgres",
        "password": "password"
    }
    
    PRODUCER_URL = "http://localhost:8002"

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
            self.assertEqual(response.status_code, 200, "El producer no acepto la notificacion")
        except Exception as e:
            print(f"\n   DEBUG: Error en Producer: {e}")
            self.skipTest(f"Producer no disponible en {self.PRODUCER_URL}: {e}")

        # 3. Consultar la base de datos con re-intentos (maximo 60 segundos)
        print(f"   ESPERANDO procesamiento de notificacion para {test_subject}...")
        record = None
        for i in range(60):
            try:
                conn = psycopg2.connect(**self.DB_CONFIG)
                cur = conn.cursor()
                cur.execute(
                    "SELECT email_destino, asunto, estado FROM emails_enviados WHERE asunto = %s",
                    (test_subject,)
                )
                record = cur.fetchone()
                cur.close()
                conn.close()
                
                if record:
                    break
            except Exception as e:
                print(f"      (Intento {i+1}) Error conectando a DB: {e}")
            
            time.sleep(1)
    
        # 4. Verificar resultados
        self.assertIsNotNone(record, f"No se encontro el registro en la DB tras 60s para el asunto: {test_subject}")
        self.assertEqual(record[0], test_email)
        self.assertEqual(record[1], test_subject)
        print(f"   Registro encontrado en DB. Estado: {record[2]}")

if __name__ == "__main__":
    unittest.main()
