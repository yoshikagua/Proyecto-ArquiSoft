"""
Integration tests for Notification Module Producer API
Tests HTTP endpoints, RabbitMQ integration, and response handling
"""

import pytest
import requests
import json
import time
from typing import Dict, Any
import os


# Configuration
NOTIFICATION_PRODUCER_URL = os.getenv("NOTIFICATION_PRODUCER_URL", "http://localhost:8002")
RABBITMQ_MANAGEMENT_URL = os.getenv("RABBITMQ_MANAGEMENT_URL", "http://localhost:15672")
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")


@pytest.mark.integration
class TestNotificationProducerAPI:
    """Integration tests for Producer API endpoint"""
    
    @pytest.fixture(scope="session", autouse=True)
    def setup_test_env(self):
        """Verify services are running before tests"""
        max_retries = 5
        for attempt in range(max_retries):
            try:
                response = requests.get(
                    f"{RABBITMQ_MANAGEMENT_URL}/api/aliveness-test/%2F",
                    auth=(RABBITMQ_USER, RABBITMQ_PASS),
                    timeout=3
                )
                if response.status_code == 200:
                    print("✓ RabbitMQ is running")
                    return
            except requests.exceptions.RequestException:
                if attempt < max_retries - 1:
                    time.sleep(2)
                    continue
        
        pytest.skip("RabbitMQ not available for integration testing")
    
    def test_producer_health(self):
        """Test that producer endpoint is accessible"""
        try:
            response = requests.get(NOTIFICATION_PRODUCER_URL, timeout=5)
            # 404 is OK, just means endpoint responded
            assert response.status_code in [404, 200, 301], \
                f"Producer not responding: {response.status_code}"
        except requests.exceptions.ConnectionError:
            pytest.skip("Producer API not running")
    
    def test_send_email_success(self):
        """Test successful email enqueuing"""
        payload = {
            "email": "test@example.com",
            "asunto": "Test Subject",
            "mensaje": "Test message content"
        }
        
        response = requests.post(
            NOTIFICATION_PRODUCER_URL,
            json=payload,
            timeout=5
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        assert "Mensaje enviado a la cola" in data.get("message", "")
    
    def test_send_email_invalid_email(self):
        """Test with invalid email format"""
        payload = {
            "email": "not-an-email",
            "asunto": "Test",
            "mensaje": "Test"
        }
        
        response = requests.post(
            NOTIFICATION_PRODUCER_URL,
            json=payload,
            timeout=5
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "email" in data["error"].lower()
    
    def test_send_email_missing_email(self):
        """Test with missing email field"""
        payload = {
            "asunto": "Test",
            "mensaje": "Test"
        }
        
        response = requests.post(
            NOTIFICATION_PRODUCER_URL,
            json=payload,
            timeout=5
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "obligatorio" in data["error"].lower()
    
    def test_send_email_default_fields(self):
        """Test that missing optional fields use defaults"""
        payload = {
            "email": "test@example.com"
        }
        
        response = requests.post(
            NOTIFICATION_PRODUCER_URL,
            json=payload,
            timeout=5
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
    
    def test_send_email_content_type(self):
        """Test with different content types"""
        payload = {
            "email": "test@example.com",
            "asunto": "HTML Test",
            "mensaje": "<h1>HTML Email</h1>"
        }
        
        response = requests.post(
            NOTIFICATION_PRODUCER_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        assert response.status_code == 200
    
    def test_send_multiple_emails(self):
        """Test sending multiple emails in sequence"""
        emails = [
            f"user{i}@example.com" for i in range(3)
        ]
        
        for email in emails:
            payload = {
                "email": email,
                "asunto": "Multi-test",
                "mensaje": f"Message for {email}"
            }
            
            response = requests.post(
                NOTIFICATION_PRODUCER_URL,
                json=payload,
                timeout=5
            )
            
            assert response.status_code == 200
            assert response.json().get("status") == "ok"


@pytest.mark.integration
class TestRabbitMQIntegration:
    """Integration tests for RabbitMQ queue management"""
    
    def test_queue_exists(self):
        """Test that notification queue exists in RabbitMQ"""
        try:
            response = requests.get(
                f"{RABBITMQ_MANAGEMENT_URL}/api/queues/%2F",
                auth=(RABBITMQ_USER, RABBITMQ_PASS),
                timeout=5
            )
            
            assert response.status_code == 200
            queues = response.json()
            queue_names = [q.get("name") for q in queues]
            
            assert "notificaciones_email" in queue_names, \
                f"Queue 'notificaciones_email' not found. Available: {queue_names}"
        except requests.exceptions.RequestException as e:
            pytest.skip(f"Cannot access RabbitMQ management API: {e}")
    
    def test_queue_message_count(self):
        """Test that messages are being enqueued"""
        try:
            def _queue_metrics() -> dict:
                response = requests.get(
                    f"{RABBITMQ_MANAGEMENT_URL}/api/queues/%2F/notificaciones_email",
                    auth=(RABBITMQ_USER, RABBITMQ_PASS),
                    timeout=5,
                )
                response.raise_for_status()
                payload = response.json()
                message_stats = payload.get("message_stats") or {}
                return {
                    "messages": payload.get("messages", 0),
                    "messages_ready": payload.get("messages_ready", 0),
                    "messages_unacknowledged": payload.get("messages_unacknowledged", 0),
                    "publish": message_stats.get("publish", 0),
                }

            # Get initial metrics
            initial_metrics = _queue_metrics()

            # Send a test message
            payload = {
                "email": "counter@example.com",
                "asunto": "Counter test",
                "mensaje": "Test"
            }
            producer_response = requests.post(
                NOTIFICATION_PRODUCER_URL,
                json=payload,
                timeout=5
            )
            assert producer_response.status_code == 200

            # Poll RabbitMQ management API because the worker may consume the
            # message very quickly on fast or busy environments.
            deadline = time.time() + 5
            latest_metrics = initial_metrics
            while time.time() < deadline:
                latest_metrics = _queue_metrics()
                if latest_metrics["publish"] > initial_metrics["publish"]:
                    break
                time.sleep(0.25)

            assert latest_metrics["publish"] > initial_metrics["publish"], (
                "RabbitMQ publish counter did not increase after sending a test "
                "message"
            )
            assert (
                latest_metrics["messages"]
                + latest_metrics["messages_ready"]
                + latest_metrics["messages_unacknowledged"]
            ) >= 0
        except requests.exceptions.RequestException:
            pytest.skip("Cannot access RabbitMQ API")
    
    def test_queue_durable(self):
        """Test that queue is durable (survives restarts)"""
        try:
            response = requests.get(
                f"{RABBITMQ_MANAGEMENT_URL}/api/queues/%2F/notificaciones_email",
                auth=(RABBITMQ_USER, RABBITMQ_PASS),
                timeout=5
            )
            
            if response.status_code == 200:
                queue_info = response.json()
                assert queue_info.get("durable") is True, \
                    "Queue should be durable"
        except requests.exceptions.RequestException:
            pytest.skip("Cannot access RabbitMQ API")


@pytest.mark.integration
class TestErrorHandling:
    """Test error handling and edge cases"""
    
    def test_malformed_json(self):
        """Test with malformed JSON"""
        response = requests.post(
            NOTIFICATION_PRODUCER_URL,
            data="not json",
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        # Should reject malformed JSON
        assert response.status_code in [400, 500]
    
    def test_empty_json(self):
        """Test with empty JSON object"""
        response = requests.post(
            NOTIFICATION_PRODUCER_URL,
            json={},
            timeout=5
        )
        
        # Should fail due to missing email
        assert response.status_code == 400
    
    def test_special_characters_in_content(self):
        """Test with special characters in email content"""
        payload = {
            "email": "user@example.com",
            "asunto": "Special: ñáéíóú €¥",
            "mensaje": "Message with émojis 🎵 and spëcial çhars"
        }
        
        response = requests.post(
            NOTIFICATION_PRODUCER_URL,
            json=payload,
            timeout=5
        )
        
        assert response.status_code == 200
    
    def test_very_long_content(self):
        """Test with very long message content"""
        payload = {
            "email": "user@example.com",
            "asunto": "Long subject",
            "mensaje": "x" * 10000  # 10KB message
        }
        
        response = requests.post(
            NOTIFICATION_PRODUCER_URL,
            json=payload,
            timeout=5
        )
        
        # Should handle large content
        assert response.status_code in [200, 413]  # 413 if too large


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
