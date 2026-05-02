import { useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Download, ThumbsUp, MessageSquare, User, Calendar,
  Music, Tag, Send, BookOpen,
} from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { usePartituras } from "../context/PartiturasContext";
import { Comentario } from "../types";

const DetallePartitura = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { partituras, toggleFavorito, toggleLike, addComentario, incrementDescargas } = usePartituras();

  const partituraBase = partituras.find((p) => p.id === id);

  const [nuevoComentario, setNuevoComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  const { user } = useAuth();

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const nombreFormateado = (() => {
    if (!user || (!user.nombre && !user.email)) return "Usuario Anónimo";
    const fullName = (user.nombre || user.email).trim();
    const parts = fullName.split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
  })();

  if (!partituraBase) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center gap-4 py-40 text-center">
          <BookOpen className="h-16 w-16 text-secondary/40" />
          <div>
            <p className="font-serif text-2xl text-foreground">Partitura no encontrada</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Es posible que haya sido eliminada o el enlace sea incorrecto.
            </p>
          </div>
          <button
            onClick={() => navigate("/partituras")}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Volver a Partituras
          </button>
        </div>
      </MainLayout>
    );
  }

  const handleLike = () => {
    if (!user) { setShowLoginAlert(true); return; }
    void toggleLike(partituraBase.id);
  };

  const handleFavorito = () => {
    if (!user) { setShowLoginAlert(true); return; }
    void toggleFavorito(partituraBase.id);
  };

  const handleDescargar = async () => {
    void incrementDescargas(partituraBase.id);
    try {
      if (!partituraBase.fileUrl) {
        showToast("No hay archivo disponible para descargar", "error");
        return;
      }
      showToast(`Descargando "${partituraBase.titulo}"…`, "info");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(partituraBase.fileUrl, {
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache" },
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
      const blob = await response.blob();
      if (blob.size === 0) throw new Error("El archivo está vacío");

      const urlWithoutQuery = partituraBase.fileUrl.split("?")[0];
      const extensionMatch = urlWithoutQuery.match(/\.([a-zA-Z0-9]+)$/);
      const extension = extensionMatch ? extensionMatch[1].toLowerCase() : "pdf";
      const safeTitle = (partituraBase.titulo || "partitura").replace(/[^a-zA-Z0-9 _-]/g, "_").trim();
      const filename = `${safeTitle}.${extension}`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 100);

      showToast(`Archivo "${filename}" descargado correctamente`, "success");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("AbortError")) showToast("Descarga cancelada por timeout", "error");
      else showToast("Error al descargar el archivo", "error");
    }
  };

  const handleEnviarComentario = async () => {
    const texto = nuevoComentario.trim();
    if (!texto) return;
    setEnviandoComentario(true);
    await new Promise((r) => setTimeout(r, 800));
    const nuevo: Comentario = {
      id: `c${Date.now()}`,
      usuario: nombreFormateado,
      avatar: nombreFormateado.charAt(0).toUpperCase(),
      texto,
      fecha: new Date().toISOString(),
    };
    await addComentario(partituraBase.id, nuevo);
    setNuevoComentario("");
    setEnviandoComentario(false);
  };

  const formatFecha = (iso: string) =>
    new Intl.DateTimeFormat("es-CO", { year: "numeric", month: "long", day: "numeric" }).format(new Date(iso));

  const favorito = partituraBase.favorito;
  const liked = partituraBase.liked ?? false;
  const likes = partituraBase.likes;
  const comentarios = partituraBase.comentarios ?? [];

  return (
    <MainLayout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 max-w-sm rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
          toast.type === "success" ? "bg-green-600 text-white" :
          toast.type === "error" ? "bg-destructive text-white" :
          "bg-secondary text-foreground"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Botón volver */}
        <button
          onClick={() => navigate("/partituras")}
          className="mb-8 flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Partituras
        </button>

        {/* Cabecera hero */}
        <div className="mb-8 rounded-2xl border border-secondary/20 bg-card p-8 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 max-w-10 bg-secondary/30" />
            <span className="text-secondary text-lg">♪</span>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {partituraBase.genero}
            </span>
          </div>

          <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            {partituraBase.titulo}
          </h1>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetadataItem icon={<User className="h-4 w-4" />} label="Compositor" value={partituraBase.autor} />
            <MetadataItem icon={<Calendar className="h-4 w-4" />} label="Año" value={String(partituraBase.anio)} />
            <MetadataItem icon={<Tag className="h-4 w-4" />} label="Género" value={partituraBase.genero} />
            <MetadataItem icon={<Music className="h-4 w-4" />} label="Instrumentos" value={partituraBase.instrumentos.join(", ")} />
          </div>

          {partituraBase.descripcion && (
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground border-t border-secondary/10 pt-5">
              {partituraBase.descripcion}
            </p>
          )}

          {/* Barra de acciones */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-secondary/10 pt-6">
            <button
              onClick={handleDescargar}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              Descargar PDF
            </button>

            <button
              onClick={handleLike}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                liked
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-secondary/30 bg-background text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              <ThumbsUp className={`h-4 w-4 transition-all ${liked ? "fill-primary scale-110" : ""}`} />
              {likes} Me gusta
            </button>

            <button
              onClick={handleFavorito}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                favorito
                  ? "border-secondary bg-secondary/15 text-secondary"
                  : "border-secondary/30 bg-background text-foreground hover:border-secondary hover:text-secondary"
              }`}
            >
              <span className={favorito ? "text-primary" : "opacity-40"}>♥</span>
              {favorito ? "En favoritos" : "Añadir a favoritos"}
            </button>

            <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <Download className="h-3.5 w-3.5" />
              {partituraBase.descargas.toLocaleString()} descargas
            </span>
          </div>
        </div>

        {/* Sección de comentarios */}
        <div className="rounded-2xl border border-secondary/20 bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-secondary" />
            <h2 className="font-serif text-xl font-semibold text-foreground">Comentarios</h2>
            <span className="ml-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
              {comentarios.length}
            </span>
          </div>

          {/* Formulario nuevo comentario */}
          <div className="mb-8 rounded-xl border border-secondary/15 bg-background p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Deja tu comentario</h3>
            {user ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  Comentando como <span className="font-semibold text-foreground">{nombreFormateado}</span>
                </p>
                <textarea
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  placeholder="Escribe tu opinión, sugerencias o experiencia con esta partitura…"
                  rows={3}
                  className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none transition-colors"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleEnviarComentario}
                    disabled={!nuevoComentario.trim() || enviandoComentario}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enviandoComentario ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Enviando…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Publicar comentario
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <User className="h-10 w-10 text-secondary/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Inicia sesión para poder compartir tu opinión sobre esta partitura.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Iniciar sesión
                </button>
              </div>
            )}
          </div>

          {/* Lista de comentarios */}
          {comentarios.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <MessageSquare className="h-10 w-10 text-secondary/30" />
              <p className="text-sm text-muted-foreground">Sé el primero en comentar esta partitura</p>
            </div>
          ) : (
            <div className="space-y-5">
              {comentarios.map((com) => (
                <ComentarioItem key={com.id} comentario={com} formatFecha={formatFecha} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal login alert */}
      {showLoginAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowLoginAlert(false)} />
          <div className="relative z-50 w-full max-w-sm rounded-xl border border-secondary/20 bg-card p-6 shadow-xl">
            <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Inicia sesión</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Para realizar esta acción necesitas acceder a tu cuenta.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLoginAlert(false)}
                className="rounded-lg border border-secondary/30 px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setShowLoginAlert(false); navigate("/login"); }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Ir al Login
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

function MetadataItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="text-secondary">{icon}</span>
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function ComentarioItem({ comentario, formatFecha }: { comentario: Comentario; formatFecha: (iso: string) => string }) {
  return (
    <div className="flex gap-4 rounded-xl bg-background p-4">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 font-serif text-sm font-bold text-primary">
        {comentario.avatar}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">{comentario.usuario}</span>
          <span className="text-xs text-muted-foreground">{formatFecha(comentario.fecha)}</span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">{comentario.texto}</p>
      </div>
    </div>
  );
}

export default DetallePartitura;
