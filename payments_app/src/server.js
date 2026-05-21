const express = require("express");
const crypto = require("crypto"); // Módulo nativo para HMAC
const paymentsRouter = require("./routes/payments");
const { initDatabase } = require("./db/init");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3002",
    "http://localhost:8080",
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  
  // MODIFICADO: Añadidos los headers de canal seguro para que CORS no los rebote
  res.header(
    "Access-Control-Allow-Headers", 
    "Content-Type, Authorization, X-Service-Name, X-Service-Timestamp, X-Service-Signature"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// --- NUEVO MIDDLEWARE: VALIDACIÓN DE CANAL SEGURO INTERNO (HMAC) ---
const verifyGatewaySignature = (req, res, next) => {
  // Excluir la raíz del microservicio o checks de salud locales del clúster
  if (req.path === "/" || req.path === "/health") {
    return next();
  }

  // 1. Extraer las cabeceras inyectadas por el API Gateway
  const serviceName = req.headers["x-service-name"];
  const timestampStr = req.headers["x-service-timestamp"];
  const signatureHex = req.headers["x-service-signature"];

  if (!serviceName || !timestampStr || !signatureHex) {
    return res.status(403).json({ 
      success: false, 
      message: "Acceso denegado: Falta la firma de canal seguro interno" 
    });
  }

  // 2. Control estricto de origen
  if (serviceName !== "api-gateway") {
    return res.status(403).json({ 
      success: false, 
      message: "Acceso denegado: Origen de petición no autorizado" 
    });
  }

  // 3. Ventana de tiempo de 15 segundos (Anti-Replay Attacks)
  const timestamp = parseInt(timestampStr, 10);
  const currentTime = Math.floor(Date.now() / 1000); // Segundos actuales Unix

  if (isNaN(timestamp) || Math.abs(currentTime - timestamp) > 15) {
    return res.status(403).json({ 
      success: false, 
      message: "Acceso denegado: La firma de la petición ha expirado o desfase de reloj" 
    });
  }

  // 4. Obtener el secreto compartido global del clúster
  const secret = process.env.INTERNAL_SERVICE_SECRET || "super-secret-internal-cluster-key-change-me";

  // 5. Re-calcular localmente la firma esperada
  const message = `${serviceName}:${timestampStr}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  // 6. Comparación en tiempo constante (Evita Side-Channel / Timing Attacks)
  try {
    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(signatureHex);

    if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
      return res.status(403).json({ 
        success: false, 
        message: "Acceso denegado: Firma criptográfica HMAC inválida" 
      });
    }
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: "Acceso denegado: Error en el procesamiento de la firma" 
    });
  }

  // Si todo es correcto, dar paso al controlador
  next();
};

// MODIFICADO: Aplicar la capa de seguridad interna antes de mapear las rutas de negocio
app.use(verifyGatewaySignature);

app.get("/", (req, res) => {
  res.json({
    message: "Bienvenido a la pasarela de pagos",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Registrar la ruta de pagos (Ahora completamente protegida)
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
