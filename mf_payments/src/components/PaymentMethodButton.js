"use client";

import Image from "next/image";

export function PaymentMethodButton({ method, isSelected, onClick }) {
  const logoSrc = method.logo?.startsWith("/") ? `/donations${method.logo}` : method.logo;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
        isSelected
          ? "border-orange-400 bg-orange-50 shadow-md shadow-orange-200/50"
          : "border-orange-200 bg-white hover:border-orange-300 hover:bg-orange-50/50"
      }`}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-white border border-orange-200">
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt={method.name}
            width={40}
            height={40}
            className="object-contain"
            unoptimized
          />
        ) : (
          <span className="text-2xl">{method.icon}</span>
        )}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold text-slate-900">{method.name}</p>
        <p className="text-xs text-amber-700/70 font-medium">
          {method.id === "creditcard" && "Visa, Mastercard, Amex"}
          {method.id === "mercadopago" && "Rápido y seguro"}
          {method.id === "nequi" && "Billetera digital"}
        </p>
      </div>
      {isSelected && (
        <svg className="w-5 h-5 text-orange-500 flex-shrink-0 font-bold" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      )}
    </button>
  );
}
