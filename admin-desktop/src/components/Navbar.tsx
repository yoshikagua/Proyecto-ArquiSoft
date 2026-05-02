import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Music, Upload, BookOpen, Menu, X, LogOut, ChevronDown, User, Heart, FileText } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems: NavItem[] = [
    { label: "Partituras", path: "/partituras", icon: <BookOpen className="h-4 w-4" /> },
    { label: "Instrumentos", path: "/instrumentos", icon: <Music className="h-4 w-4" /> },
    ...(user ? [{ label: "Subir Partitura", path: "/subir-partitura", icon: <Upload className="h-4 w-4" /> }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-secondary/20 bg-card/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <button
          onClick={() => navigate("/partituras")}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full">
            <img src="/logo.png" alt="KuisiScore Logo" className="h-full w-full object-contain" />
          </div>
          <span className="hidden font-serif text-lg font-semibold text-foreground sm:block">
            KuisiScore
          </span>
        </button>

        {/* Navegación desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                isActive(item.path)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-secondary/15 hover:text-primary"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Avatar + menú de usuario */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="h-5 w-px bg-secondary/30" />

          {user ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-secondary/15"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-serif text-sm font-bold text-primary">
                  {user.avatar ?? "?"}
                </div>
                <span className="max-w-[120px] truncate text-sm font-medium text-foreground">
                  {user.nombre ?? "Usuario"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-secondary/20 bg-card shadow-lg py-1">
                  <div className="border-b border-secondary/10 px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">{user.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  {[
                    { tab: "info", label: "Mi Perfil", icon: <User className="h-4 w-4" /> },
                    { tab: "partituras", label: "Mis Partituras", icon: <FileText className="h-4 w-4" /> },
                    { tab: "favoritos", label: "Mis Favoritos", icon: <Heart className="h-4 w-4" /> },
                  ].map((item) => (
                    <button
                      key={item.tab}
                      onClick={() => {
                        navigate(`/perfil?tab=${item.tab}`);
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/10 transition-colors"
                    >
                      {item.icon} {item.label}
                    </button>
                  ))}
                  <div className="border-t border-secondary/10 mt-1" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90"
            >
              <User className="h-4 w-4" />
              Iniciar sesión
            </button>
          )}
        </div>

        {/* Botón menú móvil */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary/20 md:hidden"
          aria-label="Abrir menú"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Menú móvil desplegable */}
      {mobileOpen && (
        <div className="border-t border-secondary/20 bg-card px-4 pb-4 shadow-md md:hidden">
          {user ? (
            <div className="flex items-center gap-3 border-b border-secondary/10 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 font-serif text-sm font-bold text-primary">
                {user.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{user.nombre}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="border-b border-secondary/10 py-4">
              <button
                onClick={() => { navigate("/login"); setMobileOpen(false); }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90"
              >
                <User className="h-4 w-4" />
                Iniciar sesión
              </button>
            </div>
          )}

          <div className="mt-2 flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary/15"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            {user && (
              <button
                onClick={handleLogout}
                className="mt-1 flex items-center gap-2 rounded-lg border border-destructive/20 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
