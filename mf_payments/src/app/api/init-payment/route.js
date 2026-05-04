import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { id_user, name_user } = await request.json();

    if (!id_user || !name_user) {
      return NextResponse.json(
        { error: "id_user y name_user son requeridos" },
        { status: 400 },
      );
    }

    const response = NextResponse.redirect(new URL("/payments", request.url), {
      status: 303,
    });

    response.cookies.set({
      name: "payment_user",
      value: JSON.stringify({ id_user, name_user }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Error al inicializar el pago" },
      { status: 500 },
    );
  }
}
