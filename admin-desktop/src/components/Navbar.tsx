/**
 * Navbar.tsx
 * Barra de navegación superior fija de la aplicación.
 *
 * Características:
 * - Logo con enlace a /partituras
 * - Enlaces de navegación activos (resaltados según la ruta actual)
 * - Menú hamburguesa para pantallas pequeñas
 * - Avatar del usuario autenticado con menú desplegable (cerrar sesión)
 * - Redirige a /login si el usuario no está autenticado al hacer clic en logout
 */

import { useState, useRef, useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Music, Upload, BookOpen, Menu, X, LogOut, ChevronDown, User, Heart, FileText, CreditCard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/** Definición de cada enlace de navegación */
interface NavItem {
    label: string;
    path: string;
    icon: ReactNode;
}

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    // ── Estado de UI ──
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    // Ref para cerrar el menú de usuario al hacer clic fuera
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

    /** Rutas principales de la aplicación */
    const navItems: NavItem[] = [
        { label: "Partituras", path: "/partituras", icon: <BookOpen className="h-4 w-4" /> },
        { label: "Instrumentos", path: "/instrumentos", icon: <Music className="h-4 w-4" /> },
        {
            label: "Donaciones",
            path: user
                ? `https://localhost/donations/payments?id_user=${user.id}&name_user=${user.nombre}`
                : "https://localhost/donations/payments",
            icon: <CreditCard className="h-4 w-4" />
        },
        ...(user ? [{ label: "Subir Partitura", path: "/subir-partitura", icon: <Upload className="h-4 w-4" /> }] : []),
    ];

    /** Determina si un enlace está activo comparando con la ruta actual */
    const isActive = (path: string) => location.pathname === path;

    /** Cierra la sesión, limpia el estado y navega al login */
    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-secondary/20 bg-card/80 backdrop-blur-md shadow-sm">
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                {/* ── Logo ── */}
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

                {/* ── Navegación desktop ── */}
                <div className="hidden items-center gap-1 md:flex">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => {
                                if (item.path.startsWith("http") || item.path.startsWith("/api/")) {
                                    window.location.href = item.path;
                                } else {
                                    navigate(item.path);
                                }
                            }}
                            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${isActive(item.path)
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-foreground hover:bg-secondary/15 hover:text-primary"
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* ── Avatar + menú de usuario (desktop) ── */}
                <div className="hidden items-center gap-3 md:flex">
                    <div className="h-5 w-px bg-secondary/30" />

                    {user ? (
                        <div ref={userMenuRef} className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-secondary/15"
                            >
                                {/* Avatar circular con la inicial del usuario */}
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-serif text-sm font-bold text-primary">
                                    {user.avatar ?? "?"}
                                </div>
                                <span className="max-w-[120px] truncate text-sm font-medium text-foreground">
                                    {user.nombre ?? "Usuario"}
                                </span>
                                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                            </button>

                            {/* Dropdown */}
                            {userMenuOpen && (
                                <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-secondary/20 bg-card shadow-lg py-1 animate-fade-in">
                                    {/* Info del usuario */}
                                    <div className="border-b border-secondary/10 px-4 py-3">
                                        <p className="text-sm font-semibold text-foreground">{user.nombre}</p>
                                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                    {/* Links de perfil */}
                                    {[
                                        { tab: "info", label: "Mi Perfil", icon: <User className="h-4 w-4" /> },
                                        { tab: "partituras", label: "Mis Partituras", icon: <FileText className="h-4 w-4" /> },
                                        { tab: "favoritos", label: "Mis Favoritos", icon: <Heart className="h-4 w-4" /> },
                                    ].map((subItem) => (
                                        <button
                                            key={subItem.tab}
                                            onClick={() => {
                                                if (location.pathname === "/perfil") {
                                                    navigate(`/perfil?tab=${subItem.tab}`, { replace: true });
                                                } else {
                                                    navigate(`/perfil?tab=${subItem.tab}`);
                                                }
                                                setUserMenuOpen(false);
                                            }}
                                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/10 transition-colors"
                                        >
                                            {subItem.icon} {subItem.label}
                                        </button>
                                    ))}
                                    <div className="border-t border-secondary/10 mt-1" />
                                    {/* Cerrar sesión */}
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

                {/* ── Botón menú móvil ── */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary/20 md:hidden"
                    aria-label="Abrir menú"
                >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* ── Menú móvil desplegable ── */}
            {mobileOpen && (
                <div className="border-t border-secondary/20 bg-card px-4 pb-4 shadow-md md:hidden">
                    {/* Info del usuario o Login */}
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
                                onClick={() => {
                                    navigate("/login");
                                    setMobileOpen(false);
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90"
                            >
                                <User className="h-4 w-4" />
                                Iniciar sesión
                            </button>
                        </div>
                    )}

                    {/* Navegación */}
                    <div className="mt-2 flex flex-col gap-1">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => {
                                    if (item.path.startsWith("http") || item.path.startsWith("/api/")) {
                                        window.location.href = item.path;
                                    } else {
                                        navigate(item.path);
                                    }
                                    setMobileOpen(false);
                                }}
                                className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${isActive(item.path)
                                    ? "bg-primary text-primary-foreground"
                                    : "text-foreground hover:bg-secondary/15"
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}

                        {/* Cerrar sesión móvil */}
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
