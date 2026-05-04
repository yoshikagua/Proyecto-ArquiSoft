const API_URL = process.env.PAYMENTS_API_URL;
const TIMEOUT_MS = 8000; // 8 segundos - sincronizado con route handler

export async function checkBackendStatus() {
  if (!API_URL) {
    throw new Error(
      "PAYMENTS_API_URL no está configurada. Añade .env.local con PAYMENTS_API_URL=http://localhost:3000"
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${API_URL}/`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await response.json();
    } catch {
      data = {
        success: false,
        message: "El backend no devolvió JSON válido",
      };
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      healthy: response.ok && response.status === 200,
    };
  } catch (error) {
    const isTimeout = error.name === "AbortError";
    return {
      ok: false,
      status: isTimeout ? 504 : 0,
      data: {
        success: false,
        message: isTimeout
          ? "Timeout: backend no responde"
          : "No se pudo conectar al backend",
        error: error.message,
      },
      healthy: false,
    };
  }
}

export async function sendPaymentToServer(paymentData) {
  if (!API_URL) {
    throw new Error(
      "PAYMENTS_API_URL no está configurada. Añade .env.local con PAYMENTS_API_URL=http://localhost:3000"
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await response.json();
    } catch {
      data = {
        success: false,
        message: "Respuesta inválida del backend",
      };
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    const isTimeout = error.name === "AbortError";
    throw new Error(
      isTimeout
        ? "Tiempo de espera agotado al contactar el backend"
        : error.message || "Error desconocido al contactar el backend"
    );
  }
}
