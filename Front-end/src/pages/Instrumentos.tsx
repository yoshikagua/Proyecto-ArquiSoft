/**
 * Instrumentos.tsx
 * Página de exploración de instrumentos musicales.
 *
 * Funcionalidades:
 * - Barra de búsqueda por nombre de instrumento
 * - Filtros rápidos por categoría (familia instrumental)
 * - Grid de tarjetas con información básica de cada instrumento
 * - Número de partituras disponibles por instrumento
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Music, X } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { Instrumento } from "@/types";
import { usePartituras } from "@/context/PartiturasContext";

const CATEGORIAS_INSTRUMENTO = ["Todas", "Cuerda", "Viento", "Percusión", "Teclado", "Otros"];

const INSTRUMENT_METADATA: Record<string, { categoria: string; imagen: string; descripcion: string }> = {
    "Piano": { categoria: "Teclado", imagen: "🎹", descripcion: "Instrumento armónico de teclado." },
    "Violín": { categoria: "Cuerda", imagen: "🎻", descripcion: "Instrumento de cuerda frotada." },
    "Viola": { categoria: "Cuerda", imagen: "🎻", descripcion: "Instrumento de cuerda de registro medio." },
    "Violonchelo": { categoria: "Cuerda", imagen: "🎻", descripcion: "Instrumento de cuerda de registro grave." },
    "Contrabajo": { categoria: "Cuerda", imagen: "🎻", descripcion: "Instrumento de cuerda de registro muy grave." },
    "Guitarra": { categoria: "Cuerda", imagen: "🎸", descripcion: "Instrumento de cuerda pulsada." },
    "Flauta": { categoria: "Viento", imagen: "🪈", descripcion: "Instrumento de viento madera." },
    "Clarinete": { categoria: "Viento", imagen: "🎶", descripcion: "Instrumento de viento madera de lengüeta." },
    "Oboe": { categoria: "Viento", imagen: "🎶", descripcion: "Instrumento de viento madera de doble lengüeta." },
    "Saxofón": { categoria: "Viento", imagen: "🎷", descripcion: "Instrumento de viento de lengüeta simple." },
    "Trompeta": { categoria: "Viento", imagen: "🎺", descripcion: "Instrumento de viento metal." },
    "Trombón": { categoria: "Viento", imagen: "🎺", descripcion: "Instrumento de viento metal de vara." },
    "Tuba": { categoria: "Viento", imagen: "🎺", descripcion: "Instrumento de viento metal grave." },
    "Percusión": { categoria: "Percusión", imagen: "🥁", descripcion: "Familia de instrumentos percutidos." },
    "Órgano": { categoria: "Teclado", imagen: "🎹", descripcion: "Instrumento de teclado y tubos." },
    "Arpa": { categoria: "Cuerda", imagen: "🪕", descripcion: "Instrumento de cuerda pulsada vertical." },
};

const Instrumentos = () => {
    const navigate = useNavigate();
    const { partituras } = usePartituras();

    // ── Estado de filtros ──
    /** Texto de búsqueda */
    const [busqueda, setBusqueda] = useState("");
    /** Categoría de instrumento seleccionada */
    const [categoriaActiva, setCategoriaActiva] = useState("Todas");

    /**
     * Lista filtrada de instrumentos según la búsqueda y categoria seleccionada.
     * Recalculado sólo cuando los filtros cambian.
     */
    const instrumentosData = useMemo<Instrumento[]>(() => {
        const counts = new Map<string, number>();

        partituras.forEach((partitura) => {
            partitura.instrumentos.forEach((inst) => {
                counts.set(inst, (counts.get(inst) || 0) + 1);
            });
        });

        return Array.from(counts.entries()).map(([nombre, partiturasCount], index) => {
            const metadata = INSTRUMENT_METADATA[nombre] || {
                categoria: "Otros",
                imagen: "🎵",
                descripcion: "Instrumento registrado en partituras de la biblioteca.",
            };

            return {
                id: `${index + 1}`,
                nombre,
                categoria: metadata.categoria,
                descripcion: metadata.descripcion,
                partiturasCount,
                imagen: metadata.imagen,
            };
        });
    }, [partituras]);

    const instrumentosFiltrados = useMemo<Instrumento[]>(() => {
        return instrumentosData.filter((inst) => {
            // Coincidencia por nombre (caso insensible)
            const coincideBusqueda = inst.nombre
                .toLowerCase()
                .includes(busqueda.toLowerCase());

            // Coincidencia por categoría
            const coincideCategoria =
                categoriaActiva === "Todas" || inst.categoria === categoriaActiva;

            return coincideBusqueda && coincideCategoria;
        });
    }, [instrumentosData, busqueda, categoriaActiva]);

    /** Navega a partituras filtrando por el instrumento seleccionado */
    const verPartituras = (nombre: string) => {
        navigate(`/partituras?instrumento=${encodeURIComponent(nombre)}`);
    };

    /** Limpia todos los filtros */
    const limpiarFiltros = () => {
        setBusqueda("");
        setCategoriaActiva("Todas");
    };

    const hayFiltrosActivos = busqueda !== "" || categoriaActiva !== "Todas";

    return (
        <MainLayout>
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

                {/* ── Encabezado de página ── */}
                <div className="mb-10 text-center">
                    <div className="mb-3 flex items-center justify-center gap-3">
                        <div className="h-px flex-1 max-w-16 bg-secondary/40" />
                        <span className="text-secondary text-xl">♫</span>
                        <div className="h-px flex-1 max-w-16 bg-secondary/40" />
                    </div>
                    <h1 className="font-serif text-4xl font-bold text-foreground">
                        Instrumentos Musicales
                    </h1>
                    <p className="mt-3 text-muted-foreground">
                        Explora las partituras por familia instrumental
                    </p>
                </div>

                {/* ── Barra de búsqueda ── */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary" />
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar instrumento…"
                        className="w-full rounded-xl border border-input bg-card py-3.5 pl-12 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 shadow-sm transition-all"
                    />
                    {busqueda && (
                        <button
                            onClick={() => setBusqueda("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* ── Chips de categoría ── */}
                <div className="mb-8 flex flex-wrap items-center gap-2">
                    {CATEGORIAS_INSTRUMENTO.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoriaActiva(cat)}
                            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${categoriaActiva === cat
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-card border border-secondary/30 text-foreground hover:border-primary hover:text-primary"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}

                    {/* Limpiar filtros */}
                    {hayFiltrosActivos && (
                        <button
                            onClick={limpiarFiltros}
                            className="ml-auto flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                            Limpiar
                        </button>
                    )}
                </div>

                {/* ── Contador de resultados ── */}
                <p className="mb-6 text-sm text-muted-foreground">
                    {instrumentosFiltrados.length === 0
                        ? "No se encontraron instrumentos"
                        : `${instrumentosFiltrados.length} instrumento${instrumentosFiltrados.length !== 1 ? "s" : ""}`}
                </p>

                {/* ── Grid de tarjetas ── */}
                {instrumentosFiltrados.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {instrumentosFiltrados.map((instrumento) => (
                            <InstrumentoCard
                                key={instrumento.id}
                                instrumento={instrumento}
                                onVerPartituras={() => verPartituras(instrumento.nombre)}
                            />
                        ))}
                    </div>
                ) : (
                    /* Estado vacío */
                    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                        <Music className="h-14 w-14 text-secondary/40" />
                        <div>
                            <p className="font-serif text-lg text-foreground">Sin resultados</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Intenta con otro nombre o categoría
                            </p>
                        </div>
                        <button
                            onClick={limpiarFiltros}
                            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                            Ver todos los instrumentos
                        </button>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

/* ─────────────────────────────────────────────
   Componente interno: InstrumentoCard
   Tarjeta que representa un instrumento musical.
───────────────────────────────────────────── */

interface InstrumentoCardProps {
    instrumento: Instrumento;
    onVerPartituras: () => void;
}

const InstrumentoCard = ({ instrumento, onVerPartituras }: InstrumentoCardProps) => {
    return (
        <div className="group rounded-xl border border-secondary/20 bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5">
            {/* Emoji/icono del instrumento */}
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-3xl shadow-sm">
                {instrumento.imagen}
            </div>

            {/* Nombre e instrumento */}
            <h2 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {instrumento.nombre}
            </h2>

            {/* Badge de categoría */}
            <span className="mt-1 inline-block rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
                {instrumento.categoria}
            </span>

            {/* Descripción breve */}
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                {instrumento.descripcion}
            </p>

            {/* Pie: número de partituras + botón */}
            <div className="mt-4 flex items-center justify-between border-t border-secondary/10 pt-4">
                <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{instrumento.partiturasCount}</span>{" "}
                    partituras
                </span>
                <button
                    onClick={onVerPartituras}
                    className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                    Explorar →
                </button>
            </div>
        </div>
    );
};

export default Instrumentos;
