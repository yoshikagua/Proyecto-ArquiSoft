import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ── Contexto de autenticación ──
import { AuthProvider } from "@/context/AuthContext";
import { PartiturasProvider } from "@/context/PartiturasContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// ── Páginas de autenticación ──
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// ── Páginas de KuisiScore (protegidas) ──
import Partituras from "./pages/Partituras";
import DetallePartitura from "./pages/DetallePartitura";
import Instrumentos from "./pages/Instrumentos";
import SubirPartitura from "./pages/SubirPartitura";
import EditarPartitura from "./pages/EditarPartitura";
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
              {/* ── Raíz: redirige a /partituras ── */}
              <Route path="/" element={<Navigate to="/partituras" replace />} />
              {/* Compatibilidad con ruta /dashboard del desktop */}
              <Route path="/dashboard" element={<Navigate to="/partituras" replace />} />

              {/* ── Ruta de autenticación ── */}
              <Route path="/login" element={<Login />} />

              {/* ── Rutas de contenido (públicas para navegar, protegidas para acciones) ──
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
                path="/editar-partitura/:id"
                element={
                  <ProtectedRoute>
                    <EditarPartitura />
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
