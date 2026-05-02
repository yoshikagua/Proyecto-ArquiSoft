import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Partitura } from "../types";
import { storageApi, type StorageScore } from "../lib/apiClient";
import { useAuth } from "./AuthContext";

interface PartiturasContextValue {
  partituras: Partitura[];
  toggleFavorito: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  addComentario: (id: string, comentario: Partitura["comentarios"][number]) => Promise<void>;
  addPartitura: (partitura: Partitura) => void;
  incrementDescargas: (id: string) => Promise<void>;
  eliminarPartitura: (id: string) => void;
  favoritas: Partitura[];
}

const PartiturasContext = createContext<PartiturasContextValue | null>(null);

export const usePartituras = (): PartiturasContextValue => {
  const ctx = useContext(PartiturasContext);
  if (!ctx) throw new Error("usePartituras debe usarse dentro de <PartiturasProvider>");
  return ctx;
};

const mapStorageScoreToPartitura = (score: StorageScore): Partitura => ({
  id: score.id,
  uploadedBy: score.uploaded_by,
  titulo: score.title,
  autor: score.composer,
  anio: score.year,
  genero: score.genre,
  instrumentos: score.instruments || [],
  likes: score.likes || 0,
  liked: score.liked ?? false,
  descargas: score.downloads || 0,
  favorito: score.favorito ?? false,
  descripcion: score.description || "",
  fileUrl: score.file_url,
  comentarios: (score.comentarios || []).map((c) => ({
    id: c.id,
    usuario: c.usuario,
    avatar: c.avatar,
    texto: c.texto,
    fecha: c.fecha,
  })),
});

export const PartiturasProvider = ({ children }: { children: ReactNode }) => {
  const { isAuth, user } = useAuth();
  const [partituras, setPartituras] = useState<Partitura[]>([]);

  const refreshFromBackend = async () => {
    try {
      const scores = await storageApi.getScores();
      setPartituras(scores.map(mapStorageScoreToPartitura));
    } catch {
      setPartituras([]);
    }
  };

  useEffect(() => {
    void refreshFromBackend();
  }, [isAuth, user?.id]);

  const toggleFavorito = async (id: string) => {
    setPartituras((prev) => prev.map((p) => (p.id === id ? { ...p, favorito: !p.favorito } : p)));
    try {
      await storageApi.toggleFavorite(id);
      await refreshFromBackend();
    } catch {
      await refreshFromBackend();
    }
  };

  const toggleLike = async (id: string) => {
    setPartituras((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const liked = p.liked ?? false;
        return { ...p, liked: !liked, likes: liked ? Math.max(0, p.likes - 1) : p.likes + 1 };
      })
    );
    try {
      await storageApi.toggleLike(id);
      await refreshFromBackend();
    } catch {
      await refreshFromBackend();
    }
  };

  const addComentario = async (id: string, comentario: Partitura["comentarios"][number]) => {
    setPartituras((prev) =>
      prev.map((p) => (p.id === id ? { ...p, comentarios: [...p.comentarios, comentario] } : p))
    );
    try {
      await storageApi.addComment(id, {
        texto: comentario.texto,
        usuario: comentario.usuario,
        avatar: comentario.avatar,
      });
      await refreshFromBackend();
    } catch {
      await refreshFromBackend();
    }
  };

  const addPartitura = (partitura: Partitura) => {
    setPartituras((prev) => {
      if (prev.some((e) => e.id === partitura.id)) return prev;
      return [partitura, ...prev];
    });
  };

  const incrementDescargas = async (id: string) => {
    setPartituras((prev) =>
      prev.map((p) => (p.id === id ? { ...p, descargas: p.descargas + 1 } : p))
    );
    try {
      await storageApi.registerDownload(id);
      await refreshFromBackend();
    } catch {
      await refreshFromBackend();
    }
  };

  const eliminarPartitura = (id: string) => {
    setPartituras((prev) => prev.filter((p) => p.id !== id));
  };

  const favoritas = partituras.filter((p) => p.favorito);

  return (
    <PartiturasContext.Provider
      value={{ partituras, toggleFavorito, toggleLike, addComentario, addPartitura, incrementDescargas, eliminarPartitura, favoritas }}
    >
      {children}
    </PartiturasContext.Provider>
  );
};

export default PartiturasContext;
