import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface AuthUser {
  id?: number;
  nombre: string;
  email: string;
  avatar: string;
  role: "admin" | "user" | "superadmin";
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuth: boolean;
  token: string | null;
  login: (token: string, userData: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const getStoredToken = () => {
    const t = localStorage.getItem("auth_token");
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
    } else {
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
    }
  }, [user, token]);

  const login = (newToken: string, userData: AuthUser) => {
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuth: !!user && !!token, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
