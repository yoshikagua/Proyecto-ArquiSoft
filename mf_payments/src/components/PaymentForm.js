"use client";

import { useState } from "react";
import Image from "next/image";
import { PaymentMethodButton } from "./PaymentMethodButton";
import { CreditCardForm } from "./CreditCardForm";

const PAYMENT_METHODS = [
  {
    id: "mercadopago",
    name: "Mercado Pago",
    color: "from-green-400 to-green-600",
    logo: "/mercadoPago_logo.png",
  },
  {
    id: "nequi",
    name: "Nequi",
    color: "from-green-500 to-teal-600",
    logo: "/nequi_logo.png",
  },
  {
    id: "creditcard",
    name: "Tarjeta de Crédito",
    color: "from-orange-400 to-orange-600",
    icon: "💳",
  },
];

export function PaymentForm({ idUser, nameUser }) {
  const [selectedMethod, setSelectedMethod] = useState("creditcard");
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("1500");
  const [currency, setCurrency] = useState("ARS");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState({});
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  const validateCreditCard = () => {
    const newErrors = {};

    if (selectedMethod === "creditcard") {
      // Validar número de tarjeta
      const cardDigits = cardNumber.replace(/\D/g, "");
      if (!cardDigits) {
        newErrors.cardNumber = "Número de tarjeta requerido";
      } else if (cardDigits.length < 13 || cardDigits.length > 19) {
        newErrors.cardNumber = "Número de tarjeta inválido";
      } else if (!validateLuhn(cardDigits)) {
        newErrors.cardNumber = "Número de tarjeta inválido";
      }

      // Validar vencimiento
      if (!expiry) {
        newErrors.expiry = "Vencimiento requerido";
      } else if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        newErrors.expiry = "Formato inválido (MM/YY)";
      } else if (!validateExpiry(expiry)) {
        newErrors.expiry = "Tarjeta expirada o fecha inválida";
      }

      // Validar CVC
      const cvcDigits = cvc.replace(/\D/g, "");
      if (!cvcDigits) {
        newErrors.cvc = "CVC requerido";
      } else if (cvcDigits.length < 3 || cvcDigits.length > 4) {
        newErrors.cvc = "CVC inválido (3-4 dígitos)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLuhn = (cardNumber) => {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  const validateExpiry = (expiryDate) => {
    const parts = expiryDate.split("/");
    if (parts.length !== 2) return false;

    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);

    if (month < 1 || month > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    const fullYear = year < 50 ? 2000 + year : 1900 + year;
    const currentFullYear = now.getFullYear();

    if (fullYear < currentFullYear) return false;
    if (fullYear === currentFullYear && month < currentMonth) return false;

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPaymentError("");
    setPaymentSuccess(null);

    // Validar tarjeta de crédito si está seleccionada
    if (!validateCreditCard()) {
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("amount", amount);
    formData.append("currency", currency);
    formData.append("method", selectedMethod);
    formData.append("id_user", idUser);
    formData.append("name_user", nameUser);

    if (selectedMethod === "creditcard") {
      formData.append("cardNumber", cardNumber.replace(/\s/g, ""));
      formData.append("expiry", expiry);
      formData.append("cvc", cvc);
    }

    try {
      const response = await fetch("/api/payments/", {
        method: "POST",
        body: formData,
      });

      let result = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok || result?.success === false) {
        setPaymentError(
          result?.message || "No se pudo procesar la donación"
        );
        return;
      }

      const redirectUrl =
        result?.redirectUrl || result?.data?.redirectUrl || result?.data?.init_point;

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      setPaymentSuccess({
        message: result?.message || "Donación procesada correctamente",
        transactionId:
          result?.data?.transactionId ||
          result?.data?.id ||
          result?.data?.operationCode ||
          null,
      });

      if (response.redirected) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error("Error:", error);
      setPaymentError("No se pudo procesar la donación. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-200/40 to-amber-200/40 rounded-full blur-lg"></div>
            <div className="relative bg-white p-3 rounded-full shadow-lg">
              <Image
                src="/donations/logo.svg"
                alt="KuisiScore"
                width={32}
                height={32}
                priority
                unoptimized
              />
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          Hacer una Donación
        </h1>
        <p className="text-amber-700/70 text-sm font-medium">
          Tu contribución nos ayuda a crecer
        </p>
      </div>

      {/* Card */}
      <div className="bg-white/80 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {paymentSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <p>{paymentSuccess.message}</p>
              {paymentSuccess.transactionId && (
                <p className="mt-1 text-xs text-emerald-800/80">
                  ID de transacción: {paymentSuccess.transactionId}
                </p>
              )}
            </div>
          )}

          {paymentError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {paymentError}
            </div>
          )}

          {/* Amount and Currency Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Monto a donar
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-amber-600 text-lg font-bold">
                  $
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-200 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-3 pl-8 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-300/50 transition font-semibold"
                />
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-200 text-slate-900 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-300/50 transition font-medium"
              >
                <option value="ARS">ARS - Peso Argentino</option>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="COP">COP - Peso Colombiano</option>
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="BRL">BRL - Real Brasileño</option>
              </select>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              Medio de pago
            </p>
            <div className="grid grid-cols-1 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <PaymentMethodButton
                  key={method.id}
                  method={method}
                  isSelected={selectedMethod === method.id}
                  onClick={() => {
                    setSelectedMethod(method.id);
                    setErrors({});
                  }}
                />
              ))}
            </div>
          </div>

          {/* Credit Card Form */}
          {selectedMethod === "creditcard" && (
            <CreditCardForm
              cardNumber={cardNumber}
              setCardNumber={setCardNumber}
              expiry={expiry}
              setExpiry={setExpiry}
              cvc={cvc}
              setCvc={setCvc}
              errors={errors}
            />
          )}

          {/* External Method Message */}
          {(selectedMethod === "nequi" || selectedMethod === "mercadopago") && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-amber-800 text-sm font-medium">
                Al continuar, serás redirigido a la plataforma de{" "}
                <span className="font-bold">
                  {selectedMethod === "nequi" ? "Nequi" : "Mercado Pago"}
                </span>{" "}
                para completar tu donación de forma segura.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-300/50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      strokeWidth="2"
                      opacity="0.25"
                      stroke="currentColor"
                    />
                    <path
                      d="M12 2a10 10 0 0 1 10 10"
                      strokeWidth="2"
                      stroke="currentColor"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                Procesando...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Completar Donación
              </>
            )}
          </button>

          <p className="text-xs text-amber-700/60 text-center mt-4 font-medium">
            Tu donación es 100% segura. No compartimos datos con terceros.
          </p>
        </form>
      </div>
    </div>
  );
}
