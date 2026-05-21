import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, BookOpen, ThumbsUp, Download, X } from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import { usePartituras } from "../context/PartiturasContext";
import { Partitura } from "../types";
import { storageApi } from "../lib/apiClient";

type OrdenPartituras = "populares" | "recientes" | "descargadas" | "alfabetico";

const Partituras = () => {
  const navigate = useNavigate();
  const { partituras: PARTITURAS_DATA } = usePartituras();

  const [busqueda, setBusqueda] = useState(() => localStorage.getItem("admin_filtro_busqueda") || "");
  const [generoActivo, setGeneroActivo] = useState(() => localStorage.getItem("admin_filtro_genero") || "Todos");
  const [instrumentoFiltro, setInstrumentoFiltro] = useState(() => localStorage.getItem("admin_filtro_instrumento") || "");
  const [ordenActivo, setOrdenActivo] = useState<OrdenPartituras>(() => (localStorage.getItem("admin_filtro_orden") as OrdenPartituras) || "populares");
  const [mostrarFiltros, setMostrarFiltros] = useState(() => !!localStorage.getItem("admin_filtro_instrumento"));

  useEffect(() => {
    localStorage.setItem("admin_filtro_busqueda", busqueda);
    localStorage.setItem("admin_filtro_genero", generoActivo);
    localStorage.setItem("admin_filtro_instrumento", instrumentoFiltro);
    localStorage.setItem("admin_filtro_orden", ordenActivo);
  }, [busqueda, generoActivo, instrumentoFiltro, ordenActivo]);
  const [generosDisponibles, setGenerosDisponibles] = useState<string[]>(["Todos"]);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const catalog = await storageApi.getCatalog();
        const genres = catalog.genres.length > 0 ? catalog.genres : [];
        setGenerosDisponibles(["Todos", ...genres]);
      } catch {
        const genresFromScores = Array.from(
          new Set(PARTITURAS_DATA.map((p) => p.genero).filter(Boolean))
        );
        setGenerosDisponibles(["Todos", ...genresFromScores]);
      }
    };
    void loadCatalog();
  }, [PARTITURAS_DATA]);

  const partiturasFiltradas = useMemo<Partitura[]>(() => {
    return PARTITURAS_DATA.filter((p) => {
      const coincideBusqueda =
        p.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.autor.toLowerCase().includes(busqueda.toLowerCase());
      const coincideGenero = generoActivo === "Todos" || p.genero === generoActivo;
      const coincideInstrumento =
        instrumentoFiltro === "" ||
        p.instrumentos.some((i) => i.toLowerCase().includes(instrumentoFiltro.toLowerCase()));
      return coincideBusqueda && coincideGenero && coincideInstrumento;
    });
  }, [busqueda, generoActivo, instrumentoFiltro, PARTITURAS_DATA]);

  const partiturasOrdenadas = useMemo<Partitura[]>(() => {
    const lista = [...partiturasFiltradas];

    switch (ordenActivo) {
      case "recientes":
        return lista.sort((a, b) => b.anio - a.anio);
      case "descargadas":
        return lista.sort((a, b) => b.descargas - a.descargas);
      case "alfabetico":
        return lista.sort((a, b) => a.titulo.localeCompare(b.titulo, "es", { sensitivity: "base" }));
      case "populares":
      default:
        return lista.sort((a, b) => b.likes - a.likes);
    }
  }, [partiturasFiltradas, ordenActivo]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setGeneroActivo("Todos");
    setInstrumentoFiltro("");
  };

  const hayFiltrosActivos = busqueda !== "" || generoActivo !== "Todos" || instrumentoFiltro !== "";

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Encabezado */}
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="h-px flex-1 max-w-16 bg-secondary/40" />
            <span className="text-secondary text-xl">𝄞</span>
            <div className="h-px flex-1 max-w-16 bg-secondary/40" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground">
            Biblioteca de Partituras
          </h1>
          <p className="mt-3 text-muted-foreground">
            Explora nuestra colección de {PARTITURAS_DATA.length} partituras musicales
          </p>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por título o autor…"
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

        {/* Chips de género + botón filtros */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {generosDisponibles.map((genero) => (
            <button
              key={genero}
              onClick={() => setGeneroActivo(genero)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                generoActivo === genero
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-secondary/30 text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {genero}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                mostrarFiltros
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-secondary/30 bg-card text-foreground hover:border-primary"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros
            </button>
            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Panel de filtros avanzados */}
        {mostrarFiltros && (
          <div className="mb-6 rounded-xl border border-secondary/20 bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Filtros avanzados</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Instrumento
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-secondary" />
                  <input
                    type="text"
                    value={instrumentoFiltro}
                    onChange={(e) => setInstrumentoFiltro(e.target.value)}
                    placeholder="Ej: Piano, Violín…"
                    className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Ordenar por
                </label>
                <select
                  value={ordenActivo}
                  onChange={(e) => setOrdenActivo(e.target.value as OrdenPartituras)}
                  className="w-full rounded-lg border border-input bg-background py-2 px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                >
                  <option value="populares">Más populares</option>
                  <option value="recientes">Más recientes</option>
                  <option value="descargadas">Más descargados</option>
                  <option value="alfabetico">Alfabético (A–Z)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Contador de resultados */}
        <p className="mb-6 text-sm text-muted-foreground">
          {partiturasFiltradas.length === 0
            ? "No se encontraron partituras"
            : `${partiturasFiltradas.length} partitura${partiturasFiltradas.length !== 1 ? "s" : ""} encontrada${partiturasFiltradas.length !== 1 ? "s" : ""}`}
        </p>

        {/* Grid de tarjetas */}
        {partiturasOrdenadas.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {partiturasOrdenadas.map((partitura) => (
              <PartituraCard
                key={partitura.id}
                partitura={partitura}
                onClick={() => navigate(`/partituras/${partitura.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <BookOpen className="h-14 w-14 text-secondary/40" />
            <div>
              <p className="font-serif text-lg text-foreground">Sin resultados</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Intenta con otros términos o ajusta los filtros
              </p>
            </div>
            <button
              onClick={limpiarFiltros}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Ver todas las partituras
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

interface PartituraCardProps {
  partitura: Partitura;
  onClick: () => void;
}

const PartituraCard = ({ partitura, onClick }: PartituraCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-xl border border-secondary/20 bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 flex flex-col h-full"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
          {partitura.genero}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">{partitura.anio}</span>
      </div>

      <div className="mb-1 flex items-start gap-3">
        <span className="mt-0.5 font-serif text-2xl text-secondary shrink-0">♪</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 break-all">
            {partitura.titulo}
          </h2>
          <p className="mt-0.5 text-sm text-secondary truncate">{partitura.autor}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 flex-1 content-start">
        {partitura.instrumentos.map((inst) => (
          <span
            key={inst}
            className="rounded-md bg-secondary/10 px-2 py-0.5 text-xs text-foreground h-fit"
          >
            {inst}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-secondary/10 pt-4">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <ThumbsUp className={`h-3.5 w-3.5 ${partitura.liked ? "fill-primary text-primary" : ""}`} />
          {partitura.likes}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Download className="h-3.5 w-3.5" />
          {partitura.descargas}
        </span>
        {partitura.favorito && (
          <span className="ml-auto text-xs text-secondary">♥ Favorita</span>
        )}
      </div>
    </button>
  );
};

export default Partituras;
