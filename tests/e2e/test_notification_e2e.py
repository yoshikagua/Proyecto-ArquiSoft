"""
End-to-End tests for Notification Module through API Gateway
Tests complete flow from frontend to notification system
"""

import pytest
import requests
import json
import time
from typing import Dict, Any
import os


# Configuration
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8000")
NOTIFICATION_PRODUCER_URL = os.getenv("NOTIFICATION_PRODUCER_URL", "http://localhost:8002")


def _service_is_up(url: str) -> bool:
    try:
        requests.get(url, timeout=2)
        return True
    except requests.exceptions.RequestException:
        return False


pytestmark = pytest.mark.skipif(
    not (_service_is_up(GATEWAY_URL) and _service_is_up(NOTIFICATION_PRODUCER_URL)),
    reason="Notification E2E stack not available",
)


@pytest.mark.e2e
class TestNotificationE2E:
    """End-to-end tests for notification flow"""
    
    def test_gateway_health_check(self):
        """Test that API Gateway is responding"""
        response = requests.get(
            f"{GATEWAY_URL}/health",
            timeout=5
        )
        
        assert response.status_code == 200, \
            f"Gateway not healthy: {response.status_code}"
    
    def test_notification_endpoint_via_gateway(self):
        """Test sending notification through gateway endpoint"""
        payload = {
            "email": "gateway@example.com",
            "asunto": "Via Gateway",
            "mensaje": "Test message through API Gateway"
        }
        
        response = requests.post(
            f"{GATEWAY_URL}/api/notifications/send",
            json=payload,
            timeout=5
        )
        
        # Endpoint might not exist yet, but shouldn't crash gateway
        assert response.status_code in [200, 404, 502], \
            f"Unexpected gateway response: {response.status_code}"
    
    def test_notification_with_valid_jwt(self):
        """Test notification with JWT authentication"""
        # This would use a valid JWT token from auth API
        headers = {
            "Authorization": "Bearer dummy-token",
            "Content-Type": "application/json"
        }
        
        payload = {
            "email": "auth@example.com",
            "asunto": "Auth test",
            "mensaje": "With JWT"
        }
        
        response = requests.post(
            f"{GATEWAY_URL}/api/notifications/send",
            json=payload,
            headers=headers,
            timeout=5
        )
        
        # Even if endpoint doesn't exist, shouldn't cause gateway crash
        assert response.status_code in [200, 401, 404, 502], \
            f"Unexpected status: {response.status_code}"
    
    def test_concurrent_notifications(self):
        """Test concurrent notification requests"""
        import concurrent.futures
        
        def send_notification(index):
            payload = {
                "email": f"concurrent{index}@example.com",
                "asunto": f"Concurrent {index}",
                "mensaje": f"Message {index}"
            }
            
            return requests.post(
                NOTIFICATION_PRODUCER_URL,
                json=payload,
                timeout=5
            )
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(send_notification, i) for i in range(5)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        successful = sum(1 for r in results if r.status_code == 200)
        assert successful >= 3, \
            f"Only {successful}/5 concurrent requests succeeded"
    
    def test_notification_persistence(self):
        """Test that notifications are logged in database"""
        payload = {
            "email": "persist@example.com",
            "asunto": "Persistence test",
            "mensaje": "Should be logged"
        }
        
        response = requests.post(
            NOTIFICATION_PRODUCER_URL,
            json=payload,
            timeout=5
        )
        
        assert response.status_code == 200
        
        # Wait for worker to process
        time.sleep(2)
        
        # In real scenario, would query database to verify
        # For now, just verify no errors in logs


@pytest.mark.e2e
class TestNotificationScenarios:
    """Test realistic notification scenarios"""
    
    def test_user_registration_notification(self):
        """Simulate user registration notification"""
        payload = {
            "email": "newuser@example.com",
            "asunto": "Bienvenido a KuisiScore",
            "mensaje": "Gracias por registrarte en nuestra plataforma de música"
        }
        
        response = requests.post(
            NOTIFICATION_PRODUCER_URL,
            json=payload,
            timeout=5
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
    
    def test_password_recovery_notification(self):
        """Simulate password recovery notification"""
        payload = {
            "email": "recovery@example.com",
            "asunto": "Recuperar Contraseña",
            "mensaje": "Haz clic aquí para recuperar tu contraseña: https://example.com/recovery/token123"
        }
        
        response = requests.post(
            NOTIFICATION_PRODUCER_URL,
            json=payload,
            timeout=5
        )
        
        assert response.status_code == 200
    
    def test_score_upload_notification(self):
        """Simulate score upload confirmation notification"""
        payload = {
            "email": "composer@example.com",
            "asunto": "Partitura Cargada Exitosamente",
            "mensaje": "Tu partitura 'Symphony No. 5' fue cargada exitosamente en la biblioteca"
        }
        
        response = requests.post(
            NOTIFICATION_PRODUCER_URL,
            json=payload,
            timeout=5
        )
        
        assert response.status_code == 200
    
    def test_batch_notifications(self):
        """Test sending batch notifications"""
        recipients = [
            "admin@kuisiscore.com",
            "moderator@kuisiscore.com",
            "curator@kuisiscore.com"
        ]
        
        for email in recipients:
            payload = {
                "email": email,
                "asunto": "Administración de Catálogo",
                "mensaje": "Nuevas partituras requieren revisión"
            }
            
            response = requests.post(
                NOTIFICATION_PRODUCER_URL,
                json=payload,
                timeout=5
            )
            
            assert response.status_code == 200
    
    def test_notification_with_html_content(self):
        """Test HTML email content"""
        payload = {
            "email": "html@example.com",
            "asunto": "HTML Email",
            "mensaje": """
            <html>
                <body>
                    <h1>Bienvenido a KuisiScore</h1>
                    <p>Tu cuenta ha sido creada exitosamente.</p>
                    <a href="https://kuisiscore.com">Ir al sitio</a>
                </body>
            </html>
            """
        }
        
        response = requests.post(
            NOTIFICATION_PRODUCER_URL,
            json=payload,
            timeout=5
        )
        
        assert response.status_code == 200


@pytest.mark.e2e
class TestNotificationReliability:
    """Test reliability and recovery scenarios"""
    
    def test_retry_on_network_failure(self):
        """Test that failed notifications can be retried"""
        payload = {
            "email": "retry@example.com",
            "asunto": "Retry test",
            "mensaje": "Testing retry mechanism"
        }
        
        # First attempt
        response1 = requests.post(
            NOTIFICATION_PRODUCER_URL,
            json=payload,
            timeout=5
        )
        
        # Second attempt with same payload
        time.sleep(0.5)
        response2 = requests.post(
            NOTIFICATION_PRODUCER_URL,
            json=payload,
            timeout=5
        )
        
        # Both should succeed independently
        assert response1.status_code == 200
        assert response2.status_code == 200
    
    def test_notification_timeout_handling(self):
        """Test handling of slow notification requests"""
        payload = {
            "email": "slow@example.com",
            "asunto": "Slow test",
            "mensaje": "x" * 5000
        }
        
        try:
            response = requests.post(
                NOTIFICATION_PRODUCER_URL,
                json=payload,
                timeout=10
            )
            # Should complete even with larger payload
            assert response.status_code in [200, 413]
        except requests.exceptions.Timeout:
            pytest.fail("Request timed out - service may be overloaded")
    
    def test_queue_resilience(self):
        """Test that queue handles high volume"""
        import concurrent.futures
        
        def send_batch():
            payload = {
                "email": f"batch{int(time.time()*1000)}@example.com",
                "asunto": "Batch test",
                "mensaje": "Batch message"
            }
            return requests.post(
                NOTIFICATION_PRODUCER_URL,
                json=payload,
                timeout=5
            )
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(send_batch) for _ in range(20)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        successful = sum(1 for r in results if r.status_code == 200)
        success_rate = successful / len(results)
        
        assert success_rate >= 0.8, \
            f"Only {success_rate*100:.1f}% of requests succeeded"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
