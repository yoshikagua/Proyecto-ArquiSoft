/**
 * PartiturasContext.tsx
 * Estado global compartido de partituras.
 * Maneja favoritos, eliminación y datos reactivos entre páginas.
 */

import { createContext, useContext, useState, type ReactNode } from "react";
import { Partitura } from "@/types";
import { PARTITURAS_MOCK } from "@/mockData";

interface PartiturasContextValue {
  partituras: Partitura[];
  toggleFavorito: (id: string) => void;
  eliminarPartitura: (id: string) => void;
  /** Partituras marcadas como favoritas */
  favoritas: Partitura[];
}

const PartiturasContext = createContext<PartiturasContextValue | null>(null);

export const usePartituras = (): PartiturasContextValue => {
  const ctx = useContext(PartiturasContext);
  if (!ctx) throw new Error("usePartituras debe usarse dentro de <PartiturasProvider>");
  return ctx;
};

export const PartiturasProvider = ({ children }: { children: ReactNode }) => {
  const [partituras, setPartituras] = useState<Partitura[]>(PARTITURAS_MOCK);

  const toggleFavorito = (id: string) => {
    setPartituras((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorito: !p.favorito } : p))
    );
  };

  const eliminarPartitura = (id: string) => {
    setPartituras((prev) => prev.filter((p) => p.id !== id));
  };

  const favoritas = partituras.filter((p) => p.favorito);

  return (
    <PartiturasContext.Provider value={{ partituras, toggleFavorito, eliminarPartitura, favoritas }}>
      {children}
    </PartiturasContext.Provider>
  );
};

export default PartiturasContext;
