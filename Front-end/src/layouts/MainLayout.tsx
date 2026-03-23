/**
 * MainLayout.tsx
 * Layout principal de la aplicación (páginas autenticadas).
 * Incluye la barra de navegación superior y el área de contenido.
 */

import { ReactNode } from "react";
import Navbar from "@/components/Navbar";

interface MainLayoutProps {
  /** Contenido de la página que se renderiza dentro del layout */
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    /* Contenedor principal con fondo crema */
    <div className="min-h-screen bg-background">
      {/* Barra de navegación superior */}
      <Navbar />

      {/* Área de contenido con padding superior para que no quede detrás del navbar */}
      <main className="pt-16">
        {children}
      </main>

      {/* Pie de página */}
      <footer className="mt-20 border-t border-secondary/20 bg-card py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
          <span className="font-serif text-sm font-semibold text-foreground">
            KuisiScore
          </span>
          <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 KuisiScore · Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
};

export default MainLayout;
