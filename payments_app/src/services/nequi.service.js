const processPayment = async (paymentData) => {
  const { amount, currency, method } = paymentData;

  // Llamada real a Nequi
  // ========================================
  // Cuando tengas credenciales de Nequi:
  // const axios = require("axios");
  // 
  // const result = await axios.post(
  //   "https://api.nequi.com/payment",
  //   {
  //     amount: amount,
  //     currency: currency,
  //     paymentMethod: method,
  //     apiKey: process.env.NEQUI_API_KEY,
  //   },
  //   {
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${process.env.NEQUI_API_TOKEN}`,
  //     },
  //   }
  // );

  // ========================================
  // Por ahora, simulamos la respuesta de Nequi
  // ========================================
  const result = {
    responseCode: "00",
    responseMessage: "Transacción exitosa",
    operationCode: "NEQ" + Math.floor(Math.random() * 1000000),
    timestamp: new Date().toISOString(),
    amount: amount,
    currency: currency,
    transactionId: "TX" + Date.now(),
    merchant: {
      id: "MERCHANT_001",
      name: "Mi Tienda",
    },
    status: "completed",
  };

  return {
    success: true,
    message: "Pago procesado correctamente con Nequi",
    gateway: "nequi",
    data: result,
  };
};

module.exports = { processPayment };