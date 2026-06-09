import { NextResponse } from "next/server";

const TIMEOUT_MS = 8000; // 8 segundos
const API_URL = process.env.PAYMENTS_API_URL;

export async function POST(request) {
  try {
    const formData = await request.formData();

    const amount = Number(formData.get("amount"));
    const currency = formData.get("currency");
    const method = formData.get("method");
    const idUser = formData.get("id_user") || undefined;
    const nameUser = formData.get("name_user") || undefined;
    const cardNumber = formData.get("cardNumber") || undefined;
    const expiry = formData.get("expiry") || undefined;
    const cvc = formData.get("cvc") || undefined;

    // Validación
    if (!API_URL) {
      return redirectWithError(
        request,
        "Configuración incompleta: PAYMENTS_API_URL no definida",
      );
    }

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return redirectWithError(
        request,
        "El monto debe ser un número mayor que cero",
      );
    }

    if (!currency || !method) {
      return redirectWithError(
        request,
        "Faltan datos obligatorios: moneda y método",
      );
    }

    // Llamada al backend con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${API_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency,
        method,
        id_user: idUser,
        name_user: nameUser,
        ...(cardNumber && { cardNumber }),
        ...(expiry && { expiry }),
        ...(cvc && { cvc }),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await response.json();
    } catch {
      return redirectWithError(
        request,
        "El servidor devolvió una respuesta inválida",
      );
    }

    if (!response.ok) {
      const errorMessage =
        data?.message || `Error ${response.status} del servidor`;
      return redirectWithError(request, errorMessage);
    }

    // Success: redirige con resultado
    const result = encodeURIComponent(JSON.stringify(data));
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3001";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;
    return NextResponse.redirect(
      new URL(`/payments?success=true&result=${result}`, baseUrl),
      { status: 303 },
    );
  } catch (error) {
    const message =
      error.name === "AbortError"
        ? "Tiempo de espera agotado. El servidor tardó demasiado."
        : error.message || "No se pudo contactar el backend";

    return redirectWithError(request, message);
  }
}

function redirectWithError(request, message) {
  const encodedError = encodeURIComponent(message);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3001";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  return NextResponse.redirect(
    new URL(`/payments?error=${encodedError}`, baseUrl),
    { status: 303 },
  );
}
