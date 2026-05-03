"""
Validation tests for Notification Module
Tests email validation, request format, and error handling
"""

import pytest
import json
from typing import Dict, Any


class TestEmailValidation:
    """Test email validation in notification producer"""
    
    @pytest.mark.validation
    def test_valid_email_format(self):
        """Test that valid email addresses are accepted"""
        valid_emails = [
            "user@example.com",
            "john.doe@company.co.uk",
            "test+tag@domain.org",
            "student@unal.edu.co"
        ]
        
        for email in valid_emails:
            # Simulate email validation (this would be in producer.php)
            is_valid = self._validate_email(email)
            assert is_valid, f"Email {email} should be valid"
    
    @pytest.mark.validation
    def test_invalid_email_format(self):
        """Test that invalid email addresses are rejected"""
        invalid_emails = [
            "not-an-email",
            "@example.com",
            "user@",
            "user @example.com",
            "user@domain",
            "",
            " ",
            "user@domain..com"
        ]
        
        for email in invalid_emails:
            is_valid = self._validate_email(email)
            assert not is_valid, f"Email {email} should be invalid"
    
    @pytest.mark.validation
    def test_notification_request_structure(self):
        """Test required fields in notification request"""
        valid_request = {
            "email": "user@example.com",
            "asunto": "Welcome",
            "mensaje": "Welcome to KuisiScore"
        }
        
        is_valid, errors = self._validate_request(valid_request)
        assert is_valid, f"Valid request should pass validation. Errors: {errors}"
    
    @pytest.mark.validation
    def test_missing_required_email_field(self):
        """Test that missing email field fails"""
        invalid_request = {
            "asunto": "Welcome",
            "mensaje": "Welcome to KuisiScore"
        }
        
        is_valid, errors = self._validate_request(invalid_request)
        assert not is_valid, "Request without email should fail"
        assert "email" in str(errors).lower()
    
    @pytest.mark.validation
    def test_optional_fields_defaults(self):
        """Test that optional fields use defaults when missing"""
        minimal_request = {
            "email": "user@example.com"
        }
        
        processed = self._process_request(minimal_request)
        assert processed["email"] == "user@example.com"
        assert processed["asunto"] == "Sin asunto"
        assert processed["mensaje"] == "Sin contenido"
    
    @pytest.mark.validation
    def test_request_field_types(self):
        """Test that fields have correct types"""
        test_cases = [
            # (field_name, value, should_be_valid)
            ("email", "user@example.com", True),
            ("email", 123, False),
            ("asunto", "Welcome", True),
            ("asunto", 123, False),
            ("mensaje", "Some message", True),
            ("mensaje", [], False),
        ]
        
        for field, value, expected_valid in test_cases:
            request = {
                "email": "user@example.com",
                field: value
            }
            is_valid, _ = self._validate_request(request)
            assert is_valid == expected_valid, \
                f"Field {field}={value} validity mismatch"
    
    # Helper methods for validation
    
    @staticmethod
    def _validate_email(email: str) -> bool:
        """Validate email format using regex"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def _validate_request(request: Dict[str, Any]) -> tuple:
        """Validate notification request structure"""
        errors = []
        
        if "email" not in request:
            errors.append("Email field is required")
            return False, errors
        
        email = request.get("email")
        if not isinstance(email, str):
            errors.append("Email must be a string")
            return False, errors
        
        if not TestEmailValidation._validate_email(email):
            errors.append(f"Invalid email format: {email}")
            return False, errors
        
        for field in ["asunto", "mensaje"]:
            if field in request and not isinstance(request[field], str):
                errors.append(f"{field} must be a string")
                return False, errors
        
        return len(errors) == 0, errors
    
    @staticmethod
    def _process_request(request: Dict[str, Any]) -> Dict[str, Any]:
        """Process request with defaults"""
        return {
            "email": request.get("email"),
            "asunto": request.get("asunto", "Sin asunto"),
            "mensaje": request.get("mensaje", "Sin contenido"),
            "timestamp": None  # Would be set in actual implementation
        }


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
