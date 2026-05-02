import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PartiturasProvider } from "./context/PartiturasContext";
import Login from "./pages/Login";
import Partituras from "./pages/Partituras";
import DetallePartitura from "./pages/DetallePartitura";
import Instrumentos from "./pages/Instrumentos";
import SubirPartitura from "./pages/SubirPartitura";
import Perfil from "./pages/Perfil";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuth } = useAuth();
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { isAuth } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuth ? <Navigate to="/partituras" replace /> : <Login />} />
      <Route path="/dashboard" element={<Navigate to="/partituras" replace />} />
      <Route
        path="/partituras"
        element={<ProtectedRoute><Partituras /></ProtectedRoute>}
      />
      <Route
        path="/partituras/:id"
        element={<ProtectedRoute><DetallePartitura /></ProtectedRoute>}
      />
      <Route
        path="/instrumentos"
        element={<ProtectedRoute><Instrumentos /></ProtectedRoute>}
      />
      <Route
        path="/subir-partitura"
        element={<ProtectedRoute><SubirPartitura /></ProtectedRoute>}
      />
      <Route
        path="/perfil"
        element={<ProtectedRoute><Perfil /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to={isAuth ? "/partituras" : "/login"} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PartiturasProvider>
          <AppRoutes />
        </PartiturasProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
