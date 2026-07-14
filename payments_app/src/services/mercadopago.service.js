const processPayment = async (paymentData) => {
  const { amount, currency, method } = paymentData;

  // Llamada real a Mercado Pago
  // ========================================
  // const mercadopago = require("mercadopago");
  // mercadopago.configure({
  //   access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
  // });
  //
  // const paymentObject = {
  //   transaction_amount: amount,
  //   currency_id: currency,
  //   payment_method_id: method,
  //   payer: {
  //     email: "test@mercadopago.com"
  //   }
  // };
  //
  // const result = await mercadopago.payment.create(paymentObject);

  // ========================================
  // Por ahora, simulamos la respuesta de Mercado Pago
  // ========================================
  const result = {
    id: Math.floor(Math.random() * 1000000000),
    status: "approved",
    status_detail: "accredited",
    payer: {
      id: "user_" + Date.now(),
      email: "customer@example.com",
      type: "customer",
    },
    transaction_amount: amount,
    currency_id: currency,
    payment_method_id: method,
    description: "Pago simulado en Mercado Pago",
    date_created: new Date().toISOString(),
    date_approved: new Date().toISOString(),
    authorization_code: "123456",
  };

  return {
    success: true,
    message: "Pago procesado correctamente con Mercado Pago",
    gateway: "mercadopago",
    data: result,
  };
};

module.exports = { processPayment };