const processPayment = async (paymentData) => {
  const { amount, currency, method } = paymentData;

  const result = {
    transactionId: `DUMMY-${Date.now()}`,
    status: "success",
    amount: amount,
    currency: currency,
    method: method,
    timestamp: new Date().toISOString(),
    message: "Donación emulada exitosamente",
  };

  return {
    success: true,
    message: "Donación emulada correctamente",
    gateway: "dummy",
    data: result,
  };
};

module.exports = { processPayment };
