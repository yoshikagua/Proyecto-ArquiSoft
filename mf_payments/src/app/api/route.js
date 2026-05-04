import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "KuisiScore demo activa. Usa POST /api/payments para procesar pagos emulados.",
  });
}
