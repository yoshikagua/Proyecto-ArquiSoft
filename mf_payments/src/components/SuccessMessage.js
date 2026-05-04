"use client";

export function SuccessMessage({ data, nameUser }) {
  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-300/30 rounded-full blur-lg animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 p-4 rounded-full">
            <svg
              className="w-12 h-12 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Success Card */}
      <div className="bg-white/95 backdrop-blur border-2 border-emerald-200 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            ¡Gracias{nameUser && ` ${nameUser}`} por tu donación!
          </h2>
          <p className="text-slate-600 font-medium">
            Tu generosidad nos ayuda a seguir adelante
          </p>
        </div>

        {/* Transaction Details */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-emerald-200">
            <span className="text-slate-700 font-semibold">Monto donado</span>
            <span className="font-bold text-lg text-emerald-700">
              {formatCurrency(data?.data?.amount, data?.data?.currency)}
            </span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-emerald-200">
            <span className="text-slate-700 font-semibold">
              ID de Transacción
            </span>
            <span className="font-mono text-sm text-emerald-600 break-all font-bold">
              {data?.data?.transactionId}
            </span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-emerald-200">
            <span className="text-slate-700 font-semibold">Método</span>
            <span className="text-slate-900 capitalize font-bold">
              {data?.data?.method === "creditcard"
                ? "Tarjeta de Crédito"
                : data?.data?.method === "mercadopago"
                  ? "Mercado Pago"
                  : "Nequi"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-700 font-semibold">Fecha</span>
            <span className="text-slate-900 text-sm font-medium">
              {formatDate(data?.data?.timestamp)}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="bg-emerald-100 border-2 border-emerald-300 rounded-lg p-3 text-center">
          <p className="text-emerald-800 font-bold">
            ✓ Donación completada con éxito
          </p>
        </div>

        {/* Action Button */}
        <a
          href="/payments"
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-lg transition-all text-center shadow-md block mt-6"
        >
          Hacer otra donación
        </a>
      </div>
    </div>
  );
}
