"use client";

export function ErrorMessage({ error }) {
  const getErrorIcon = (errorMsg) => {
    const msg = errorMsg?.toLowerCase() || "";
    if (msg.includes("timeout") || msg.includes("tardó")) return "⏱️";
    if (msg.includes("configuración") || msg.includes("backend")) return "⚙️";
    if (msg.includes("tarjeta") || msg.includes("número")) return "💳";
    if (msg.includes("moneda") || msg.includes("método")) return "🔀";
    return "⚠️";
  };

  const getErrorTitle = (errorMsg) => {
    const msg = errorMsg?.toLowerCase() || "";
    if (msg.includes("timeout") || msg.includes("tardó"))
      return "Tiempo de espera agotado";
    if (msg.includes("configuración") || msg.includes("backend"))
      return "Error de conexión";
    if (msg.includes("tarjeta") || msg.includes("número")) return "Tarjeta inválida";
    if (msg.includes("moneda") || msg.includes("método")) return "Datos incompletos";
    return "Error al procesar";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Error Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-rose-300/30 rounded-full blur-lg animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-rose-400 to-rose-600 p-4 rounded-full text-3xl">
            {getErrorIcon(error)}
          </div>
        </div>
      </div>

      {/* Error Card */}
      <div className="bg-white/95 backdrop-blur border-2 border-rose-200 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
            {getErrorTitle(error)}
          </h2>
          <p className="text-slate-600 font-medium">Algo no salió como se esperaba</p>
        </div>

        {/* Error Details */}
        <div className="bg-rose-50 border-2 border-rose-200 rounded-lg p-4 space-y-2">
          <p className="text-rose-800 text-sm leading-relaxed font-medium">{error || "Error desconocido"}</p>
        </div>

        {/* Help Tips */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 space-y-2">
          <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
            ¿Qué puedo hacer?
          </p>
          <ul className="space-y-1 text-xs text-amber-900 font-medium">
            <li>✓ Verifica que tu conexión a Internet funcione correctamente</li>
            <li>✓ Comprueba que los datos de tu tarjeta sean correctos</li>
            <li>✓ Intenta de nuevo en unos momentos</li>
          </ul>
        </div>

        {/* Action Button */}
        <a
          href="/payments"
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-lg transition-all text-center shadow-md block mt-6"
        >
          Intentar de nuevo
        </a>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-amber-700/60 font-medium">
        Si el problema persiste, contacta a soporte
      </p>
    </div>
  );
}
