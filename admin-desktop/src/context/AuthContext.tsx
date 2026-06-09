import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface AuthUser {
  id?: number;
  nombre: string;
  apellido?: string;
  email: string;
  avatar: string;
  role: "admin" | "user" | "superadmin";
  bio?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuth: boolean;
  token: string | null;
  login: (token: string, userData: AuthUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const getStoredToken = () => {
    const t = localStorage.getItem("auth_token") || localStorage.getItem("access_token");
    return !t || t === "undefined" || t === "null" ? null : t;
  };

  const [token, setToken] = useState<string | null>(getStoredToken);
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      if (!getStoredToken()) return null;
      const stored = localStorage.getItem("auth_user");
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user && token) {
      localStorage.setItem("auth_user", JSON.stringify(user));
      localStorage.setItem("auth_token", token);
      localStorage.setItem("access_token", token);
    } else {
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("access_token");
    }
  }, [user, token]);

  const login = (newToken: string, userData: AuthUser) => {
    if (!newToken || newToken === "undefined" || newToken === "null") {
      setToken(null);
      setUser(null);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("access_token");
      return;
    }

    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, isAuth: !!user && !!token, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
