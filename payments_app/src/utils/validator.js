const validatePaymentData = (data) => {
  const { amount, currency, method } = data;
  const normalizedAmount = typeof amount === "string" ? Number(amount.trim()) : amount;

  if (!amount || !currency || !method) {
    return {
      valid: false,
      message: "Faltan datos obligatorios: amount, currency y method",
    };
  }

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return {
      valid: false,
      message: "El monto debe ser un número mayor que cero",
    };
  }

  return { valid: true, amount: normalizedAmount };
};

const validateCreditCardData = (data) => {
  const { cardNumber, expiry, cvc } = data;

  if (!cardNumber || !expiry || !cvc) {
    return {
      valid: false,
      message: "Datos de tarjeta incompletos",
    };
  }

  // Validar formato del número de tarjeta
  const cardDigits = cardNumber.replace(/\D/g, "");
  if (cardDigits.length < 13 || cardDigits.length > 19) {
    return {
      valid: false,
      message: "Número de tarjeta inválido",
    };
  }

  // Validar formato de expiry MM/YY
  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    return {
      valid: false,
      message: "Formato de vencimiento inválido. Usa MM/YY",
    };
  }

  // Validar CVC
  const cvcDigits = cvc.replace(/\D/g, "");
  if (cvcDigits.length < 3 || cvcDigits.length > 4) {
    return {
      valid: false,
      message: "CVC debe tener 3 o 4 dígitos",
    };
  }

  return { valid: true };
};

module.exports = { validatePaymentData, validateCreditCardData };
