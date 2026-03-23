import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ── Contexto de autenticación ──
import { AuthProvider } from "@/context/AuthContext";
import { PartiturasProvider } from "@/context/PartiturasContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// ── Páginas de autenticación (públicas) ──
import Login from "./pages/Login";
import Register from "./pages/Register";
import RecoverPassword from "./pages/RecoverPassword";
import VerifyCodePage from "./pages/VerifyCode";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// ── Páginas de KuisiScore (protegidas) ──
import Partituras from "./pages/Partituras";
import DetallePartitura from "./pages/DetallePartitura";
import Instrumentos from "./pages/Instrumentos";
import SubirPartitura from "./pages/SubirPartitura";
import Perfil from "./pages/Perfil";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/*
          AuthProvider envuelve el árbol de rutas para que todos los
          componentes puedan acceder al contexto de autenticación
          mediante el hook useAuth().
        */}
        <AuthProvider>
          <PartiturasProvider>
          <Routes>
            {/* ── Raíz: redirige a /partituras (que a su vez guardará si no hay sesión) ── */}
            <Route path="/" element={<Navigate to="/partituras" replace />} />

            {/* ── Rutas públicas de autenticación ── */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recover-password" element={<RecoverPassword />} />
            <Route path="/verify-code" element={<VerifyCodePage />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ── Rutas protegidas (requieren sesión iniciada) ──
                ProtectedRoute verifica useAuth().isAuth; si es false
                redirige a /login guardando la ruta intentada en location.state.from.
            */}
            <Route
              path="/partituras"
              element={<Partituras />}
            />
            <Route
              path="/partituras/:id"
              element={<DetallePartitura />}
            />
            <Route
              path="/instrumentos"
              element={<Instrumentos />}
            />
            <Route
              path="/subir-partitura"
              element={
                <ProtectedRoute>
                  <SubirPartitura />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Perfil />
                </ProtectedRoute>
              }
            />

            {/* ── Catch-all ── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </PartiturasProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

