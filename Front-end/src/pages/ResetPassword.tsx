import { useState, useMemo } from "react";
import { Eye, EyeOff, Check, X, CheckCircle2 } from "lucide-react";

import { Link } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [success, setSuccess] = useState(false);

  const rules = useMemo(
    () => [
      { label: "Mínimo 5 caracteres", valid: password.length >= 5 },
      { label: "Al menos 1 mayúscula", valid: /[A-Z]/.test(password) },
      { label: "Al menos 1 número", valid: /\d/.test(password) },
      { label: "Al menos 1 carácter especial", valid: /[^A-Za-z0-9]/.test(password) },
    ],
    [password]
  );

  const allRulesValid = rules.every((r) => r.valid);
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allRulesValid && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) setSuccess(true);
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="animate-fade-in space-y-6 rounded-xl border border-border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>

          <h1 className="font-serif text-2xl font-semibold text-foreground">
            ¡Contraseña restablecida!
          </h1>

          <p className="text-sm text-muted-foreground">
            Tu contraseña ha sido restablecida correctamente.
          </p>

          <Link
            to="/login"
            className="inline-block w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-secondary"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="animate-fade-in space-y-6 rounded-xl border border-border bg-card p-8 shadow-lg">
        {/* Logo */}
        <div className="flex justify-center">
          <img src="/logo.png" alt="Logo KuisiScore" className="h-20 w-20 object-contain" />
        </div>

        {/* Title */}
        <div className="space-y-2 text-center">
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Crear nueva contraseña
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu nueva contraseña para acceder nuevamente a tu cuenta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Nueva contraseña
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() =>
                  setTouched((t) => ({ ...t, password: true }))
                }
                placeholder="Ingresa tu nueva contraseña"
                className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring/20"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Rules */}
            <div className="space-y-1 pt-1">
              {rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {touched.password || password.length > 0 ? (
                    rule.valid ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-destructive" />
                    )
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                  )}

                  <span
                    className={
                      touched.password || password.length > 0
                        ? rule.valid
                          ? "text-success"
                          : "text-destructive"
                        : "text-muted-foreground"
                    }
                  >
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Confirmar nueva contraseña
            </label>

            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() =>
                  setTouched((t) => ({ ...t, confirm: true }))
                }
                placeholder="Confirma tu nueva contraseña"
                className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring/20"
              />

              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {touched.confirm &&
              confirmPassword.length > 0 &&
              !passwordsMatch && (
                <p className="text-xs text-destructive">
                  Las contraseñas no coinciden.
                </p>
              )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Restablecer contraseña
          </button>
        </form>

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-primary underline underline-offset-2 transition-colors hover:text-secondary"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;