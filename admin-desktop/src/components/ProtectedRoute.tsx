/**
 * ProtectedRoute.tsx
 * Componente de guardia para rutas que requieren autenticación.
 *
 * Si el usuario NO está autenticado, redirige automáticamente a /login
 * y guarda la ruta intentada en el estado de navegación (state.from)
 * para que después del login se pueda redirigir de vuelta a ella.
 *
 * Uso en App.tsx:
 *   <Route path="/partituras" element={<ProtectedRoute><Partituras /></ProtectedRoute>} />
 */

import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
    /** Componente hijo a renderizar si el usuario está autenticado */
    children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuth } = useAuth();
    const location = useLocation();

    if (!isAuth) {
        /**
         * Redirige a /login guardando la ruta de origen en el state.
         * Esto permite que Login.tsx redirija de vuelta a esta ruta tras autenticarse.
         * `replace` evita que la ruta protegida quede en el historial de navegación.
         */
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Usuario autenticado → renderizar el contenido protegido
    return <>{children}</>;
};

export default ProtectedRoute;
