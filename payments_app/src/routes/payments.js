const express = require("express");
const { processPayment } = require("../controllers/paymentController");

const router = express.Router();

// GET: Redirige al frontend SSR checkout page
router.get("/", (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
  return res.redirect(`${frontendUrl}/payments`);
});

// POST: Procesa el pago
router.post("/", processPayment);

module.exports = router;
