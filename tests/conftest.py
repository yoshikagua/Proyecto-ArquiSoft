"""Pytest bootstrap for environment-independent test execution.

This module normalizes TLS-related environment variables so tests that use
httpx/requests do not depend on a machine-specific `SSL_CERT_FILE` value.
"""

from __future__ import annotations

import os
from pathlib import Path

import certifi


def _set_ca_bundle_if_missing_or_invalid(var_name: str, bundle_path: str) -> None:
    current_value = os.environ.get(var_name)
    if current_value and Path(current_value).exists():
        return
    os.environ[var_name] = bundle_path


_CA_BUNDLE = certifi.where()

_set_ca_bundle_if_missing_or_invalid("SSL_CERT_FILE", _CA_BUNDLE)
_set_ca_bundle_if_missing_or_invalid("REQUESTS_CA_BUNDLE", _CA_BUNDLE)
_set_ca_bundle_if_missing_or_invalid("CURL_CA_BUNDLE", _CA_BUNDLE)