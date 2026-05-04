"use client";

export function CreditCardForm({
  cardNumber,
  setCardNumber,
  expiry,
  setExpiry,
  cvc,
  setCvc,
  errors,
}) {
  const handleCardChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    // Formato: XXXX XXXX XXXX XXXX
    if (value.length > 19) value = value.slice(0, 19);

    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ").substring(0, 23);

    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);

    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }

    setExpiry(value);
  };

  const handleCvcChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    setCvc(value);
  };

  return (
    <div className="space-y-4">
      {/* Card Number */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          Número de Tarjeta
        </label>
        <input
          type="text"
          value={cardNumber}
          onChange={handleCardChange}
          placeholder="1234 5678 9012 3456"
          maxLength="23"
          className={`w-full bg-gradient-to-r from-amber-50 to-orange-50 border-2 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition font-semibold tracking-widest ${
            errors.cardNumber
              ? "border-rose-400 focus:border-rose-400 focus:ring-rose-300/50"
              : "border-orange-200 focus:border-orange-400 focus:ring-orange-300/50"
          }`}
        />
        {errors.cardNumber && (
          <p className="text-xs text-rose-600 font-medium">
            {errors.cardNumber}
          </p>
        )}
      </div>

      {/* Expiry and CVC Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Expiry Date */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Vencimiento
          </label>
          <input
            type="text"
            value={expiry}
            onChange={handleExpiryChange}
            placeholder="MM/YY"
            maxLength="5"
            className={`w-full bg-gradient-to-r from-amber-50 to-orange-50 border-2 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition font-semibold tracking-widest ${
              errors.expiry
                ? "border-rose-400 focus:border-rose-400 focus:ring-rose-300/50"
                : "border-orange-200 focus:border-orange-400 focus:ring-orange-300/50"
            }`}
          />
          {errors.expiry && (
            <p className="text-xs text-rose-600 font-medium">{errors.expiry}</p>
          )}
        </div>

        {/* CVC */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            CVC
          </label>
          <input
            type="text"
            value={cvc}
            onChange={handleCvcChange}
            placeholder="123"
            maxLength="4"
            className={`w-full bg-gradient-to-r from-amber-50 to-orange-50 border-2 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition font-semibold tracking-widest ${
              errors.cvc
                ? "border-rose-400 focus:border-rose-400 focus:ring-rose-300/50"
                : "border-orange-200 focus:border-orange-400 focus:ring-orange-300/50"
            }`}
          />
          {errors.cvc && (
            <p className="text-xs text-rose-600 font-medium">{errors.cvc}</p>
          )}
        </div>
      </div>
    </div>
  );
}
