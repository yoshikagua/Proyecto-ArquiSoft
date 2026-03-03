/**
 * AuthContext.tsx
 * Contexto global de autenticación de la aplicación.
 *
 * Provee:
 * - `user`      → datos del usuario autenticado (null si no hay sesión)
 * - `isAuth`    → booleano de conveniencia
 * - `login()`   → guarda la sesión (token + datos de usuario)
 * - `logout()`  → limpia la sesión y redirige al login
 *
 * La sesión se persiste en `localStorage` para que sobreviva recargas de página.
 * Cuando el backend esté disponible, reemplaza `mockLogin` por una llamada real
 * a /auth/login y almacena el JWT recibido.
 */

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";

/* ─────────────────────────────────────────────
   Tipos
───────────────────────────────────────────── */

/** Datos mínimos del usuario que se guardan en sesión */
export interface AuthUser {
    nombre: string;
    email: string;
    /** Inicial del avatar mostrado en la Navbar */
    avatar: string;
}

interface AuthContextValue {
    /** Usuario autenticado o null si no hay sesión */
    user: AuthUser | null;
    /** Atajo: true cuando hay usuario autenticado */
    isAuth: boolean;
    /**
     * Inicia sesión guardando el token y los datos del usuario.
     * @param token  - JWT recibido del backend (actualmente mock)
     * @param userData - Datos básicos del usuario para mostrar en la UI
     */
    login: (token: string, userData: AuthUser) => void;
    /** Cierra sesión, limpia el almacenamiento local y redirige a /login */
    logout: () => void;
}

/* ─────────────────────────────────────────────
   Contexto y hook de acceso
───────────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Hook para acceder al contexto de autenticación desde cualquier componente.
 * Lanza un error si se usa fuera de <AuthProvider>.
 */
export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth debe usarse dentro de <AuthProvider>");
    }
    return ctx;
};

/* ─────────────────────────────────────────────
   Proveedor
───────────────────────────────────────────── */

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    /**
     * Inicializa el usuario desde localStorage para persistir la sesión
     * entre recargas de página.
     */
    const [user, setUser] = useState<AuthUser | null>(() => {
        try {
            const stored = localStorage.getItem("auth_user");
            return stored ? (JSON.parse(stored) as AuthUser) : null;
        } catch {
            return null;
        }
    });

    /** Guarda el usuario en localStorage cada vez que cambia */
    useEffect(() => {
        if (user) {
            localStorage.setItem("auth_user", JSON.stringify(user));
        } else {
            localStorage.removeItem("auth_user");
            localStorage.removeItem("access_token");
        }
    }, [user]);

    /**
     * Registra la sesión del usuario.
     * Guarda el token JWT en localStorage y los datos del usuario en el estado.
     *
     * @param token    - JWT devuelto por el backend
     * @param userData - Datos del usuario para la UI
     */
    const login = (token: string, userData: AuthUser) => {
        localStorage.setItem("access_token", token);
        setUser(userData);
    };

    /**
     * Cierra la sesión limpiando el estado y el almacenamiento local.
     * La redirección al login se realiza desde el componente que llama logout()
     * (por ejemplo, el botón de la Navbar) usando useNavigate.
     */
    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuth: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
