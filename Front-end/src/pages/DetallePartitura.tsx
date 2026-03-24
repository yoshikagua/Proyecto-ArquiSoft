/**
 * DetallePartitura.tsx
 * Página de detalle completo de una partitura.
 *
 * Muestra:
 * - Información completa: título, autor, año, género, instrumentos
 * - Acciones: descargar, dar like, agregar/quitar de favoritos
 * - Sección de comentarios con formulario para dejar uno nuevo
 *
 * Los datos se obtienen del mock de partituras usando el ID de la URL.
 */

import { useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Download,
    ThumbsUp,
    Star,
    MessageSquare,
    User,
    Calendar,
    Music,
    Tag,
    Send,
    BookOpen,
} from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { usePartituras } from "@/context/PartiturasContext";
import { Comentario } from "@/types";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DetallePartitura = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { partituras, toggleFavorito, toggleLike, addComentario } = usePartituras();

    // Busca la partitura en el estado compartido por su ID
    const partituraBase = partituras.find((p) => p.id === id);

    // ── Estado del formulario de comentario ──
    const [nuevoComentario, setNuevoComentario] = useState("");
    const [enviandoComentario, setEnviandoComentario] = useState(false);

    // ── Datos de usuario autenticado ──
    const { user } = useAuth();
    const [showLoginAlert, setShowLoginAlert] = useState(false);

    const nombreFormateado = (() => {
        if (!user || (!user.nombre && !user.email)) return "Usuario Anónimo";
        const fullName = (user.nombre || user.email).trim();
        const parts = fullName.split(/\s+/);
        if (parts.length === 1) return parts[0];

        const firstName = parts[0];
        const lastInitial = parts[1].charAt(0).toUpperCase();
        return `${firstName} ${lastInitial}.`;
    })();

    /* ── Partitura no encontrada ── */
    if (!partituraBase) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center gap-4 py-40 text-center">
                    <BookOpen className="h-16 w-16 text-secondary/40" />
                    <div>
                        <p className="font-serif text-2xl text-foreground">
                            Partitura no encontrada
                        </p>
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

    /* ── Acciones del usuario ── */

    /** Alterna el like del usuario en esta partitura */
    const handleLike = () => {
        if (!user) {
            setShowLoginAlert(true);
            return;
        }
        toggleLike(partituraBase.id);
    };

    const handleFavorito = () => {
        if (!user) {
            setShowLoginAlert(true);
            return;
        }
        toggleFavorito(partituraBase.id);
    };

    const favorito = partituraBase.favorito;
    const liked = partituraBase.liked ?? false;
    const likes = partituraBase.likes;
    const comentarios = partituraBase.comentarios ?? [];

    /** Simula la descarga del archivo PDF de la partitura */
    const handleDescargar = () => {
        // En producción: llamada a la API para obtener el PDF
        alert(`Descargando "${partituraBase.titulo}"…`);
    };

    /** Envía un nuevo comentario a la lista local */
    const handleEnviarComentario = async () => {
        const texto = nuevoComentario.trim();
        const usuario = nombreFormateado;

        if (!texto) return;

        setEnviandoComentario(true);
        // Simulación de latencia de red
        await new Promise((r) => setTimeout(r, 800));

        const nuevo: Comentario = {
            id: `c${Date.now()}`,
            usuario,
            // Inicial del avatar a partir del nombre
            avatar: usuario.charAt(0).toUpperCase(),
            texto,
            fecha: new Date().toISOString(),
        };

        addComentario(partituraBase.id, nuevo);
        setNuevoComentario("");
        setEnviandoComentario(false);
    };

    /** Formatea una fecha ISO a formato legible en español */
    const formatFecha = (iso: string) =>
        new Intl.DateTimeFormat("es-CO", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(new Date(iso));

    return (
        <MainLayout>
            <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

                {/* ── Botón volver ── */}
                <button
                    onClick={() => navigate("/partituras")}
                    className="mb-8 flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Partituras
                </button>

                {/* ── Cabecera hero ── */}
                <div className="mb-8 rounded-2xl border border-secondary/20 bg-card p-8 shadow-sm">
                    {/* Decorador musical */}
                    <div className="mb-4 flex items-center gap-3">
                        <div className="h-px flex-1 max-w-10 bg-secondary/30" />
                        <span className="text-secondary text-lg">♪</span>
                    </div>

                    {/* Badge de género */}
                    <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            {partituraBase.genero}
                        </span>
                    </div>

                    {/* Título principal */}
                    <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
                        {partituraBase.titulo}
                    </h1>

                    {/* Metadata: autor, año, categoría, instrumentos */}
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <MetadataItem
                            icon={<User className="h-4 w-4" />}
                            label="Compositor"
                            value={partituraBase.autor}
                        />
                        <MetadataItem
                            icon={<Calendar className="h-4 w-4" />}
                            label="Año"
                            value={String(partituraBase.anio)}
                        />
                        <MetadataItem
                            icon={<Tag className="h-4 w-4" />}
                            label="Género"
                            value={partituraBase.genero}
                        />
                        <MetadataItem
                            icon={<Music className="h-4 w-4" />}
                            label="Instrumentos"
                            value={partituraBase.instrumentos.join(", ")}
                        />
                    </div>

                    {/* Descripción */}
                    {partituraBase.descripcion && (
                        <p className="mt-5 text-sm leading-relaxed text-muted-foreground border-t border-secondary/10 pt-5">
                            {partituraBase.descripcion}
                        </p>
                    )}

                    {/* ── Barra de acciones ── */}
                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-secondary/10 pt-6">

                        {/* Botón descargar */}
                        <button
                            onClick={handleDescargar}
                            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
                        >
                            <Download className="h-4 w-4" />
                            Descargar PDF
                        </button>

                        {/* Botón like */}
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${liked
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-secondary/30 bg-background text-foreground hover:border-primary hover:text-primary"
                                }`}
                        >
                            <ThumbsUp
                                className={`h-4 w-4 transition-all ${liked ? "fill-primary scale-110" : ""}`}
                            />
                            {likes} Me gusta
                        </button>

                        {/* Botón favorito */}
                        <button
                            onClick={handleFavorito}
                            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${favorito
                                ? "border-secondary bg-secondary/15 text-secondary"
                                : "border-secondary/30 bg-background text-foreground hover:border-secondary hover:text-secondary"
                                }`}
                        >
                            <img
                                src="/favicon.ico"
                                alt="Favorito"
                                className={`h-4 w-4 transition-transform ${favorito ? "animate-favorite-pop" : "grayscale opacity-50"}`}
                            />
                            {favorito ? "En favoritos" : "Añadir a favoritos"}
                        </button>

                        {/* Estadística de descargas */}
                        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Download className="h-3.5 w-3.5" />
                            {partituraBase.descargas.toLocaleString()} descargas
                        </span>
                    </div>
                </div>

                {/* ── Sección de comentarios ── */}
                <div className="rounded-2xl border border-secondary/20 bg-card p-8 shadow-sm">

                    {/* Título de sección */}
                    <div className="mb-6 flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-secondary" />
                        <h2 className="font-serif text-xl font-semibold text-foreground">
                            Comentarios
                        </h2>
                        <span className="ml-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
                            {comentarios.length}
                        </span>
                    </div>

                    {/* ── Formulario nuevo comentario ── */}
                    <div className="mb-8 rounded-xl border border-secondary/15 bg-background p-5">
                        <h3 className="mb-4 text-sm font-semibold text-foreground">
                            Deja tu comentario
                        </h3>
                        {user ? (
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                                    <User className="h-4 w-4" />
                                    Comentando como <span className="font-semibold text-foreground">{nombreFormateado}</span>
                                </p>
                                {/* Texto del comentario */}
                                <textarea
                                    value={nuevoComentario}
                                    onChange={(e) => setNuevoComentario(e.target.value)}
                                    placeholder="Escribe tu opinión, sugerencias o experiencia con esta partitura…"
                                    rows={3}
                                    className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none transition-colors"
                                />
                                {/* Botón enviar */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleEnviarComentario}
                                        disabled={!nuevoComentario.trim() || enviandoComentario}
                                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {enviandoComentario ? (
                                            <>
                                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12" cy="12" r="10"
                                                        stroke="currentColor" strokeWidth="4"
                                                    />
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

                    {/* ── Lista de comentarios ── */}
                    {comentarios.length === 0 ? (
                        /* Estado vacío */
                        <div className="flex flex-col items-center gap-3 py-12 text-center">
                            <MessageSquare className="h-10 w-10 text-secondary/30" />
                            <p className="text-sm text-muted-foreground">
                                Sé el primero en comentar esta partitura
                            </p>
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

            {/* Modal para login en acciones protegidas */}
            <AlertDialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Inicia sesión</AlertDialogTitle>
                        <AlertDialogDescription>
                            Para realizar esta acción necesitas acceder a tu cuenta. Inicia sesión o regístrate para interactuar con esta partitura.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => navigate("/login")}>
                            Ir al Login
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </MainLayout>
    );
};

/* ─────────────────────────────────────────────
   Sub-componentes
───────────────────────────────────────────── */

/** Muestra un par etiqueta–valor con un icono decorativo */
function MetadataItem({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: string;
}) {
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

/** Representa una entrada individual de comentario */
function ComentarioItem({
    comentario,
    formatFecha,
}: {
    comentario: Comentario;
    formatFecha: (iso: string) => string;
}) {
    return (
        <div className="flex gap-4 rounded-xl bg-background p-4">
            {/* Avatar con inicial del nombre */}
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 font-serif text-sm font-bold text-primary">
                {comentario.avatar}
            </div>
            <div className="flex-1">
                {/* Nombre y fecha */}
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-foreground">
                        {comentario.usuario}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {formatFecha(comentario.fecha)}
                    </span>
                </div>
                {/* Texto del comentario */}
                <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                    {comentario.texto}
                </p>
            </div>
        </div>
    );
}

export default DetallePartitura;
