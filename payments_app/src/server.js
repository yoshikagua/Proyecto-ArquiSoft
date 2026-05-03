const express = require("express");
const paymentsRouter = require("./routes/payments");
const { initDatabase } = require("./db/init");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:3001",
    "http://localhost:3000",
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Bienvenido a la pasarela de pagos",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Registrar la ruta de pagos
app.use("/payments", paymentsRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error("[ERROR]", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, async () => {
  const dbInit = await initDatabase();
  if (!dbInit) {
    console.error("[ERROR] No se pudo inicializar la base de datos");
    process.exit(1);
  }
  console.log(`[✓] Servidor escuchando en http://localhost:${PORT}`);
});
