import { useState } from "react";
import { z } from "zod";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { useNavigate } from "react-router-dom";

const codeSchema = z
  .string()
  .trim()
  .min(1, "El código es obligatorio.")
  .length(8, "El código debe tener exactamente 8 caracteres.");

const MOCK_VALID_CODE = "ABC12345";

type Status = "idle" | "success" | "error";

const VerifyCodePage = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [resending, setResending] = useState(false);

  const validation = codeSchema.safeParse(code);
  const isValid = validation.success;

  const handleChange = (value: string) => {
    if (value.length <= 8) {
      setCode(value);
      if (status !== "idle") {
        setStatus("idle");
        setErrorMsg("");
      }
    }
  };

  const handleVerify = () => {
    if (!isValid) {
      setStatus("error");
      setErrorMsg(validation.error!.errors[0].message);
      return;
    }

    if (code.toUpperCase() === MOCK_VALID_CODE) {
      setStatus("success");
      setErrorMsg("");
    } else {
      setStatus("error");
      setErrorMsg("El código no es correcto.");
    }
  };

  const handleResend = () => {
    setResending(true);
    setTimeout(() => setResending(false), 2000);
  };

  const borderClass =
    status === "error"
      ? "border-destructive"
      : status === "success"
      ? "border-success"
      : "border-input";

  return (
    <AuthLayout>
      <div className="rounded-lg bg-card p-8 shadow-card sm:p-10">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <img
            src={logo}
            alt="Logo partituras"
            className="h-20 w-20 object-contain"
          />
        </div>

        {/* Título */}
        <h1 className="mb-2 text-center font-serif text-3xl font-semibold text-foreground">
          Verificar código
        </h1>

        {/* Descripción */}
        <p className="mb-8 text-center text-sm leading-relaxed text-muted-foreground">
          Hemos enviado un código de verificación a tu correo electrónico.
          Ingresa el código de 8 caracteres para continuar.
        </p>

        {/* Campo de código */}
        <div className="mb-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            🔐 Código de verificación
          </label>

          <input
            type="text"
            maxLength={8}
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Ingresa el código"
            className={`w-full rounded-lg border-2 bg-input-bg px-4 py-3 text-base tracking-widest text-foreground outline-none transition-colors placeholder:tracking-normal placeholder:text-muted-foreground focus:border-primary ${borderClass}`}
            autoComplete="one-time-code"
          />

          <div className="mt-1.5 flex items-center justify-between">
            {status === "error" && (
              <p className="text-sm text-destructive">{errorMsg}</p>
            )}
            {status === "success" && (
              <p className="text-sm text-success">
                Código verificado correctamente.
              </p>
            )}
            {status === "idle" && <span />}
            <span className="ml-auto text-xs text-muted-foreground">
              {code.length}/8
            </span>
          </div>
        </div>

        {/* Botón Verificar */}
        <button
          onClick={handleVerify}
          disabled={!isValid || status === "success"}
          className="mb-4 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Verificar código
        </button>

        {status === "success" && (
  <button
    onClick={() => navigate("/reset-password")}
    className="mb-4 w-full animate-fade-in rounded-lg bg-accent py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
  >
    Continuar para restablecer contraseña
  </button>
)}

        {/* Links */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm font-medium text-secondary transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {resending ? "Código reenviado ✓" : "Reenviar código"}
          </button>

          <Link
            to="/login"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyCodePage;
