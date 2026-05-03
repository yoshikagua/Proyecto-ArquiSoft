const mercadopagoService = require("../services/mercadopago.service");
const nequiService = require("../services/nequi.service");
const dummyPaymentService = require("../services/dummyPayment.service");
const creditCardService = require("../services/creditCard.service");
const Payment = require("../models/Payment");

const {
  validatePaymentData,
  validateCreditCardData,
} = require("../utils/validator");

const processPayment = async (req, res) => {
  try {
    const {
      amount,
      currency,
      method,
      id_user,
      name_user,
      cardNumber,
      expiry,
      cvc,
    } = req.body;

    const validation = validatePaymentData({ amount, currency, method });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        timestamp: new Date().toISOString(),
      });
    }

    if (!id_user || !name_user) {
      return res.status(400).json({
        success: false,
        message: "id_user y name_user son requeridos",
        timestamp: new Date().toISOString(),
      });
    }

    let response;
    const methodLower = method.toLowerCase();

    switch (methodLower) {
      case "mercadopago":
        response = await mercadopagoService.processPayment({
          amount,
          currency,
        });
        break;
      case "nequi":
        response = await nequiService.processPayment({
          amount,
          currency,
        });
        break;
      case "creditcard":
        const ccValidation = validateCreditCardData({
          cardNumber,
          expiry,
          cvc,
        });
        if (!ccValidation.valid) {
          return res.status(400).json({
            success: false,
            message: ccValidation.message,
            timestamp: new Date().toISOString(),
          });
        }
        response = await creditCardService.processPayment({
          amount,
          currency,
          method: methodLower,
          cardNumber,
          expiry,
          cvc,
        });
        break;
      case "dummy":
      default:
        response = await dummyPaymentService.processPayment({
          amount,
          currency,
          method: methodLower,
        });
    }

    if (!response.success) {
      return res.status(400).json({
        ...response,
        timestamp: new Date().toISOString(),
      });
    }

    // Guardar el pago en la BD
    await Payment.create({
      userId: id_user,
      userName: name_user,
      amount,
      currency,
      method: methodLower,
      status: response.success ? "success" : "failed",
      transactionId: response.data?.transactionId,
      metadata: {
        paymentGateway: response.data?.gateway,
      },
    });

    return res.status(201).json({
      ...response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[PAYMENT_ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Error al procesar la donación",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = { processPayment };
