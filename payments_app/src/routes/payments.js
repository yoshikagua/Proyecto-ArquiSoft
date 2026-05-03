const express = require("express");
const { processPayment } = require("../controllers/paymentController");

const router = express.Router();

// GET: Devuelve información básica del módulo de pagos
router.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Payments API activa",
    endpoint: "/payments",
  });
});

// POST: Procesa el pago
router.post("/", processPayment);

module.exports = router;
