import json
import subprocess


HELPER = ["node", "tests/integration/payments/run_payments.js"]


def run_helper(*args, payload=None):
    cmd = HELPER + list(args)
    proc = subprocess.run(
        cmd,
        input=json.dumps(payload or {}),
        capture_output=True,
        text=True,
        timeout=10,
    )
    assert proc.returncode == 0, f"helper failed: {proc.stderr}"
    return json.loads(proc.stdout.strip())


def test_get_payments_handler_json():
    data = run_helper("get")
    assert data["message"] == "Payments API activa"
    assert data["endpoint"] == "/payments"


def test_dummy_payment_success():
    out = run_helper(
        "post",
        payload={
            "amount": 10.0,
            "currency": "USD",
            "method": "dummy",
            "id_user": "u1",
            "name_user": "Test User",
        },
    )
    assert out["status"] == 201
    assert out["body"]["success"] is True
    assert out["body"]["gateway"] == "dummy"


def test_creditcard_valid():
    out = run_helper(
        "post",
        payload={
            "amount": 15.5,
            "currency": "USD",
            "method": "creditcard",
            "id_user": "u2",
            "name_user": "Card User",
            "cardNumber": "4111111111111111",
            "expiry": "12/30",
            "cvc": "123",
        },
    )
    assert out["status"] == 201
    assert out["body"]["success"] is True
    assert out["body"]["gateway"] == "creditcard"


def test_creditcard_invalid_number():
    out = run_helper(
        "post",
        payload={
            "amount": 20.0,
            "currency": "USD",
            "method": "creditcard",
            "id_user": "u3",
            "name_user": "Bad Card",
            "cardNumber": "1234567890123456",
            "expiry": "12/30",
            "cvc": "123",
        },
    )
    assert out["status"] == 400
    msg = out["body"]["message"].lower()
    assert "tarjeta" in msg and "inv" in msg


def test_missing_amount():
    out = run_helper(
        "post",
        payload={
            "currency": "USD",
            "method": "dummy",
            "id_user": "u4",
            "name_user": "No Amount",
        },
    )
    assert out["status"] == 400
    assert "Faltan datos obligatorios" in out["body"]["message"]


def test_missing_user():
    out = run_helper(
        "post",
        payload={
            "amount": 5.0,
            "currency": "USD",
            "method": "dummy",
        },
    )
    assert out["status"] == 400
    assert "id_user y name_user son requeridos" in out["body"]["message"]


def test_mercadopago_service_contract():
    out = run_helper(
        "service",
        "mercadopago",
        payload={"amount": 25.0, "currency": "USD", "method": "mercadopago"},
    )
    assert out["message"] == "Pago procesado correctamente con Mercado Pago"
    assert out["success"] is True
    assert out["gateway"] == "mercadopago"
    assert out["data"]["status"] == "approved"
    assert out["data"]["transaction_amount"] == 25.0
    assert out["data"]["currency_id"] == "USD"
    assert out["data"]["payment_method_id"] == "mercadopago"


def test_nequi_service_contract():
    out = run_helper(
        "service",
        "nequi",
        payload={"amount": 25.0, "currency": "USD", "method": "nequi"},
    )
    assert out["message"] == "Pago procesado correctamente con Nequi"
    assert out["success"] is True
    assert out["gateway"] == "nequi"
    assert out["data"]["responseCode"] == "00"
    assert "exit" in out["data"]["responseMessage"].lower()
    assert out["data"]["amount"] == 25.0
    assert out["data"]["currency"] == "USD"
    assert out["data"]["transactionId"].startswith("TX")
    assert out["data"]["status"] == "completed"
