/**
 * PartiturasContext.tsx
 * Estado global compartido de partituras.
 * Maneja favoritos, eliminación y datos reactivos entre páginas.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Partitura } from "@/types";
import { PARTITURAS_MOCK } from "@/mockData";

interface PartiturasContextValue {
  partituras: Partitura[];
  toggleFavorito: (id: string) => void;
  toggleLike: (id: string) => void;
  addComentario: (id: string, comentario: Partitura["comentarios"][number]) => void;
  eliminarPartitura: (id: string) => void;
  /** Partituras marcadas como favoritas */
  favoritas: Partitura[];
}

const PARTITURAS_STORAGE_KEY = "partituras_state";

const PartiturasContext = createContext<PartiturasContextValue | null>(null);

export const usePartituras = (): PartiturasContextValue => {
  const ctx = useContext(PartiturasContext);
  if (!ctx) throw new Error("usePartituras debe usarse dentro de <PartiturasProvider>");
  return ctx;
};

export const PartiturasProvider = ({ children }: { children: ReactNode }) => {
  const [partituras, setPartituras] = useState<Partitura[]>(() => {
    try {
      const stored = localStorage.getItem(PARTITURAS_STORAGE_KEY);
      if (!stored) {
        return PARTITURAS_MOCK.map((partitura) => ({ ...partitura, liked: false }));
      }

      const parsed = JSON.parse(stored) as Partitura[];
      return parsed.map((partitura) => ({ ...partitura, liked: partitura.liked ?? false }));
    } catch {
      return PARTITURAS_MOCK.map((partitura) => ({ ...partitura, liked: false }));
    }
  });

  useEffect(() => {
    localStorage.setItem(PARTITURAS_STORAGE_KEY, JSON.stringify(partituras));
  }, [partituras]);

  const toggleFavorito = (id: string) => {
    setPartituras((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorito: !p.favorito } : p))
    );
  };

  const toggleLike = (id: string) => {
    setPartituras((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const liked = p.liked ?? false;
        return {
          ...p,
          liked: !liked,
          likes: liked ? Math.max(0, p.likes - 1) : p.likes + 1,
        };
      })
    );
  };

  const addComentario = (id: string, comentario: Partitura["comentarios"][number]) => {
    setPartituras((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              comentarios: [...p.comentarios, comentario],
            }
          : p
      )
    );
  };

  const eliminarPartitura = (id: string) => {
    setPartituras((prev) => prev.filter((p) => p.id !== id));
  };

  const favoritas = partituras.filter((p) => p.favorito);

  return (
    <PartiturasContext.Provider
      value={{ partituras, toggleFavorito, toggleLike, addComentario, eliminarPartitura, favoritas }}
    >
      {children}
    </PartiturasContext.Provider>
  );
};

export default PartiturasContext;
