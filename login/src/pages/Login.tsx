import { useState } from "react";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("Correo o contraseña incorrectos. Inténtalo de nuevo.");
  };

  return (
    <AuthLayout>
      <div className="relative rounded-xl border border-secondary/30 bg-card p-8 shadow-lg sm:p-10">

        {/* Botón volver */}
        <button
          onClick={() => navigate("/")}
          className="absolute left-6 top-6 flex items-center gap-1 text-xs font-medium text-secondary hover:underline underline-offset-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a la página de inicio
        </button>

        {/* Gold accent line */}
        <div className="mx-auto mb-6 h-0.5 w-16 rounded-full bg-secondary" />

        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full ring-2 ring-secondary/40 ring-offset-2 ring-offset-card">
            <img
              src={logo}
              alt="Logo de la Biblioteca Musical"
              className="h-20 w-20 rounded-full object-cover shadow-md sm:h-24 sm:w-24"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Accede a tu Biblioteca Musical
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Tu colección de partituras te espera
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors"
                required
              />
            </div>
          </div>

          {/* Forgot password */}
          <div className="text-right">
            <span
              onClick={() => navigate("/recover-password")}
              className="cursor-pointer text-xs font-medium text-secondary hover:underline underline-offset-4 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Iniciar sesión
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-secondary/30" />
          <span className="text-xs text-secondary">✦</span>
          <div className="h-px flex-1 bg-secondary/30" />
        </div>

        {/* Create account */}
        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <span
            onClick={() => navigate("/register")}
            className="cursor-pointer font-medium text-secondary hover:underline"
          >
            Crear cuenta
          </span>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        © 2026 Biblioteca Musical · Todos los derechos reservados
      </p>
    </AuthLayout>
  );
};

export default Login;