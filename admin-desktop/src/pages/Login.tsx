import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { authApi, ApiClientError, API_BASE_URL } from "../lib/apiClient";

const normalizeRole = (role?: string | number): "user" | "admin" | "superadmin" => {
  if (typeof role === "number") {
    if (role === 3) return "superadmin";
    if (role === 2) return "admin";
    return "user";
  }
  const normalized = (role || "").toLowerCase();
  if (normalized.includes("super")) return "superadmin";
  if (normalized.includes("admin")) return "admin";
  return "user";
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const testConnection = async () => {
    setDebugInfo("Probando...");
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      const text = await res.text();
      setDebugInfo(`✅ OK (${res.status}): ${text}`);
    } catch (e) {
      setDebugInfo(`❌ Error: ${String(e)}`);
    }
  };

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Completa todos los campos.");
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.login({ email, password });
      const token = response.access_token || response.token;

      if (!token) {
        throw new ApiClientError("Respuesta de autenticación inválida: token ausente", 500, {
          message: "Token ausente",
        });
      }

      const role = normalizeRole(response.user?.role_id ?? response.user?.role);

      // Validación de rol: solo admin y superadmin pueden acceder
      // Descomenta esta sección si quieres permitir usuarios normales
      /*
      if (role !== "admin" && role !== "superadmin") {
        setError("Acceso restringido. Solo administradores pueden ingresar.");
        setLoading(false);
        return;
      }
      */

      const firstName = response.user?.first_name || email.split("@")[0];
      const lastName = response.user?.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim();

      login(token, {
        id: response.user?.id ? Number(response.user.id) : undefined,
        nombre: fullName,
        avatar: firstName.charAt(0).toUpperCase(),
        email: response.user?.email || email,
        role,
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 0) {
          setError("No se pudo conectar con el servidor. Verifica que el gateway esté corriendo en localhost:8000");
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

        {/* Línea dorada */}
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

        {/* Título */}
        <h1 className="mb-2 text-center font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Panel de Administración
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Accede con tu cuenta de administrador
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
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

        {/* Divisor */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-secondary/30" />
          <span className="text-xs text-secondary">✦</span>
          <div className="h-px flex-1 bg-secondary/30" />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Solo administradores y superadministradores pueden acceder a este panel.
        </p>
      </div>

      {/* DEBUG TEMPORAL - borrar después */}
      <div className="mt-4 rounded-lg border border-yellow-400 bg-yellow-50 p-3 text-xs text-yellow-900 space-y-2">
        <p className="font-bold">🔧 Debug Info</p>
        <p>API URL: <code className="font-mono">{API_BASE_URL}</code></p>
        <p>Origin: <code className="font-mono">{window.location.origin}</code></p>
        <button
          onClick={testConnection}
          className="mt-1 rounded bg-yellow-400 px-3 py-1 font-semibold hover:bg-yellow-500"
        >
          Probar conexión
        </button>
        {debugInfo && <p className="mt-1 break-all font-mono">{debugInfo}</p>}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        © 2026 KuisiScore · Panel de Administración
      </p>
    </AuthLayout>
  );
};

export default Login;
