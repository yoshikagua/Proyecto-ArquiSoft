/**
 * Login.tsx
 * Página de inicio de sesión.
 *
 * Flujo:
 * 1. El usuario ingresa correo y contraseña.
 * 2. Se llama a authApi.login() que proxía al gateway (/api/auth/login).
 * 3. El gateway proxía a User_api (/auth/login).
 * 4. Recibe el JWT y datos del usuario, los guarda en el contexto de autenticación.
 * 5. Si el usuario intentó entrar a una ruta protegida antes del login,
 *    se redirige a esa ruta; de lo contrario a /partituras.
 */

import { useState } from "react";
import { Mail, Lock, ArrowLeft } from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { useAuth } from "@/context/AuthContext";
import { authApi, ApiClientError } from "@/lib/apiClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  /**
   * Ruta a la que redirigir tras autenticarse exitosamente.
   * Si el usuario fue redirigido desde una ruta protegida, vuelve a ella.
   * De lo contrario va a la página principal de partituras.
   */
  const from: string = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/partituras";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validación básica
    if (!email || !password) {
      setError("Completa todos los campos.");
      setLoading(false);
      return;
    }

    try {
      // Llamada real al gateway (POST /api/auth/login)
      // El gateway proxía a User_api (POST /auth/login)
      const response = await authApi.login({ email, password });

      // Guardar el token JWT en localStorage
      localStorage.setItem("auth_token", response.access_token);

      // Guardar sesión en el contexto de autenticación
      const firstName = response.user?.first_name || response.user?.nombre || email.split("@")[0];
      const lastName = response.user?.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim();

      login(response.access_token, {
        nombre: fullName,
        avatar: firstName.charAt(0).toUpperCase(),
        email: response.user?.email || email,
        role: (response.user?.role || "user") as "admin" | "user",
      });

      // Redirigir a la ruta de origen (o /partituras)
      navigate(from, { replace: true });
    } catch (err) {
      // Manejo de errores de la API
      if (err instanceof ApiClientError) {
        if (err.status === 0) {
          setError(
            "No se pudo conectar con el servidor. Verifica que el gateway esté corriendo en localhost:8000"
          );
        } else if (err.status === 401) {
          setError("Correo o contraseña incorrectos. Inténtalo de nuevo.");
        } else if (err.status === 503) {
          setError("El servicio de autenticación no está disponible. Intenta más tarde.");
        } else {
          setError(err.message || "Error en la autenticación");
        }
      } else {
        setError("Error desconocido durante la autenticación");
      }
    } finally {
      setLoading(false);
    }
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
              src="/logo.png"
              alt="Logo de KuisiScore"
              className="h-20 w-20 rounded-full object-cover shadow-md sm:h-24 sm:w-24"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Accede a KuisiScore
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
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Verificando…
              </>
            ) : (
              "Iniciar sesión"
            )}
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
        © 2026 KuisiScore · Todos los derechos reservados
      </p>
    </AuthLayout>
  );
};

export default Login;