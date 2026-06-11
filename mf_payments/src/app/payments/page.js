"use client";

import { use, useState, useEffect } from "react";
import { PaymentForm } from "@/components/PaymentForm";
import { SuccessMessage } from "@/components/SuccessMessage";
import { ErrorMessage } from "@/components/ErrorMessage";

export default function PaymentsPage({ searchParams }) {
  const params = use(searchParams);
  const success = params?.success === "true";
  const error = params?.error;
  const [paymentUser, setPaymentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const paymentCookie = cookies.find((c) => c.startsWith("payment_user="));

    if (paymentCookie) {
      try {
        const data = JSON.parse(
          decodeURIComponent(paymentCookie.split("=")[1]),
        );
        setPaymentUser(data);
      } catch (e) {
        console.error("Error parsing payment cookie:", e);
      }
    } else {
      // Fallback: usar parámetros de URL si no hay cookie
      if (params?.id_user && params?.name_user) {
        setPaymentUser({
          id_user: params.id_user,
          name_user: params.name_user,
        });
      }
    }
    setIsLoading(false);
  }, [params]);

  let responseData = null;
  if (params?.result) {
    try {
      responseData = JSON.parse(decodeURIComponent(params.result));
    } catch {
      responseData = null;
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12 px-4">
        <div className="mx-auto max-w-2xl flex items-center justify-center h-96">
          <div className="animate-spin">
            <svg
              className="w-12 h-12 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.25" />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                strokeWidth="2"
                stroke="currentColor"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </main>
    );
  }

  const mainAppUrl = process.env.NEXT_PUBLIC_MAIN_APP_URL || "http://localhost/partituras";

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Botón para volver */}
        <div className="mb-6">
          <a
            href={mainAppUrl}
            className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-800 transition-colors font-medium bg-white/50 px-4 py-2 rounded-lg border border-orange-200/50 shadow-sm backdrop-blur-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a la página principal
          </a>
        </div>

        {/* Success State */}
        {success && responseData ? (
          <SuccessMessage
            data={responseData}
            paymentUser={paymentUser}
          />
        ) : error ? (
          /* Error State */
          <ErrorMessage error={error} />
        ) : !paymentUser ? (
          /* No User State - Testing */
          <div className="bg-white/80 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-6 shadow-xl">
            <div className="text-center space-y-4 mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Testing - Sin usuario
              </h1>
              <p className="text-amber-700/70">
                Para testing, usa el endpoint /api/init-payment:
              </p>
            </div>
            <div className="bg-slate-100 rounded p-4 text-sm font-mono text-slate-800 space-y-2">
              <p>curl -X POST http://localhost:3001/api/init-payment \</p>
              <p className="pl-4">-H "Content-Type: application/json" \</p>
              <p className="pl-4">-d '{`{"id_user": "user123", "name_user": "Juan"}`}'</p>
            </div>
            <p className="text-center text-sm text-slate-600 mt-4">
              O accede a <code className="bg-slate-100 px-2 py-1 rounded">/payments?id_user=123&name_user=Juan</code>
            </p>
          </div>
        ) : (
          /* Default Form State */
          <PaymentForm
            idUser={paymentUser?.id_user}
            nameUser={paymentUser?.name_user}
          />
        )}
      </div>
    </main>
  );
}