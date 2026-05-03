// Validación del algoritmo de Luhn
const validateLuhn = (cardNumber) => {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Detecta el tipo de tarjeta
const detectCardType = (cardNumber) => {
  const digits = cardNumber.replace(/\D/g, "");
  if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(digits)) return "visa";
  if (/^5[1-5][0-9]{14}$/.test(digits)) return "mastercard";
  if (/^3[47][0-9]{13}$/.test(digits)) return "amex";
  if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(digits)) return "discover";
  return null;
};

// Valida la fecha de vencimiento
const validateExpiry = (expiryDate) => {
  const parts = expiryDate.split("/");
  if (parts.length !== 2) return false;

  const month = parseInt(parts[0], 10);
  const year = parseInt(parts[1], 10);

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear() % 100; // Últimos 2 dígitos
  const currentMonth = now.getMonth() + 1;

  // Asumir que cualquier año es en el rango actual/próximo siglo
  const fullYear = year < 50 ? 2000 + year : 1900 + year;
  const currentFullYear = now.getFullYear();

  if (fullYear < currentFullYear) return false;
  if (fullYear === currentFullYear && month < currentMonth) return false;

  return true;
};

// Valida el CVC
const validateCVC = (cvc, cardType) => {
  const digits = cvc.replace(/\D/g, "");
  if (cardType === "amex") {
    return digits.length === 4;
  }
  return digits.length === 3;
};

const processPayment = async (paymentData) => {
  const { amount, currency, method, cardNumber, expiry, cvc } = paymentData;

  // Validación de tarjeta
  if (!cardNumber || !expiry || !cvc) {
    return {
      success: false,
      message: "Datos de tarjeta incompletos",
    };
  }

  // Validar número de tarjeta
  if (!validateLuhn(cardNumber)) {
    return {
      success: false,
      message: "Número de tarjeta inválido",
    };
  }

  const cardType = detectCardType(cardNumber);
  if (!cardType) {
    return {
      success: false,
      message: "Tipo de tarjeta no soportado",
    };
  }

  // Validar fecha de vencimiento
  if (!validateExpiry(expiry)) {
    return {
      success: false,
      message: "Fecha de vencimiento inválida o expirada",
    };
  }

  // Validar CVC
  if (!validateCVC(cvc, cardType)) {
    return {
      success: false,
      message: `CVC inválido para ${cardType}`,
    };
  }

  // Si todas las validaciones pasaron, simular procesamiento exitoso
  const result = {
    transactionId: `CC-${Date.now()}`,
    status: "success",
    amount: amount,
    currency: currency,
    method: "creditcard",
    cardType: cardType,
    lastFourDigits: cardNumber.slice(-4),
    timestamp: new Date().toISOString(),
    message: "Donación procesada exitosamente",
  };

  return {
    success: true,
    message: "Donación procesada correctamente",
    gateway: "creditcard",
    data: result,
  };
};

module.exports = { processPayment };
