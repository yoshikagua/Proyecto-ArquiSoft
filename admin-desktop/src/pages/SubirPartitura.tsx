import { useState, useEffect, type ReactNode, type ChangeEvent, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, FileText, User, Calendar, Music, BookOpen, X, Check, ArrowLeft } from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import { storageApi, ApiClientError } from "../lib/apiClient";
import { usePartituras } from "../context/PartiturasContext";

const subirPartituraSchema = z.object({
  titulo: z.string().trim().min(2, "El título debe tener al menos 2 caracteres").max(120, "Máximo 120 caracteres"),
  autor: z.string().trim().min(2, "Ingresa el nombre del autor/compositor").max(80, "Máximo 80 caracteres"),
  anio: z
    .number()
    .int("Ingresa un año válido")
    .min(1400, "El año debe ser posterior a 1400")
    .max(new Date().getFullYear(), "El año no puede ser futuro"),
  formatoAgrupacion: z.string().min(1, "Selecciona el formato de agrupación"),
  genero: z.string().min(1, "Selecciona un género musical"),
  descripcion: z.string().max(500, "Máximo 500 caracteres").optional(),
});

type SubirPartituraData = z.infer<typeof subirPartituraSchema>;

const SubirPartitura = () => {
  const navigate = useNavigate();
  const { addPartitura } = usePartituras();

  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [archivoError, setArchivoError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [instrumentosSeleccionados, setInstrumentosSeleccionados] = useState<string[]>([]);
  const [instrumentoError, setInstrumentoError] = useState("");
  const [catalogoGeneros, setCatalogoGeneros] = useState<string[]>([]);
  const [catalogoInstrumentos, setCatalogoInstrumentos] = useState<string[]>([]);
  const [catalogoFormatos, setCatalogoFormatos] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<{ msg: string; desc?: string; type: "success" | "error" | "warning" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "warning", desc?: string) => {
    setToast({ msg, type, desc });
    setTimeout(() => setToast(null), 5000);
  };

  const { register, handleSubmit, formState: { errors, isValid }, reset } = useForm<SubirPartituraData>({
    resolver: zodResolver(subirPartituraSchema),
    mode: "onChange",
  });

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const catalog = await storageApi.getCatalog();
        setCatalogoGeneros(catalog.genres || []);
        setCatalogoInstrumentos(catalog.instruments || []);
        setCatalogoFormatos(catalog.formats || []);
      } catch {
        showToast("No se pudo cargar el catálogo", "error", "Intenta nuevamente en unos segundos.");
      }
    };
    void loadCatalog();
  }, []);

  const procesarArchivo = (file: File) => {
    if (file.type !== "application/pdf") {
      setArchivoError("Solo se permiten archivos PDF.");
      setArchivoSeleccionado(null);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setArchivoError("El archivo no puede superar 20 MB.");
      setArchivoSeleccionado(null);
      return;
    }
    setArchivoError("");
    setArchivoSeleccionado(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) procesarArchivo(file);
  };

  const toggleInstrumento = (nombre: string) => {
    setInstrumentosSeleccionados((prev) => {
      const actualizado = prev.includes(nombre) ? prev.filter((i) => i !== nombre) : [...prev, nombre];
      if (actualizado.length > 0) setInstrumentoError("");
      return actualizado;
    });
  };

  const onSubmit = async (data: SubirPartituraData) => {
    if (!archivoSeleccionado) {
      setArchivoError("Debes adjuntar el archivo PDF de la partitura.");
      return;
    }
    if (instrumentosSeleccionados.length === 0) {
      setInstrumentoError("Selecciona al menos un instrumento.");
      return;
    }

    setEnviando(true);
    try {
      const uploadedScore = await storageApi.uploadScore({
        title: data.titulo,
        composer: data.autor,
        genre: data.genero,
        format_type: data.formatoAgrupacion,
        year: data.anio,
        description: data.descripcion || "",
        instruments: instrumentosSeleccionados,
        file: archivoSeleccionado,
      });

      addPartitura({
        id: uploadedScore.id,
        uploadedBy: uploadedScore.uploaded_by,
        titulo: data.titulo,
        autor: data.autor,
        anio: data.anio,
        genero: data.genero,
        instrumentos: instrumentosSeleccionados,
        likes: 0,
        liked: false,
        descargas: 0,
        favorito: false,
        descripcion: data.descripcion || "",
        comentarios: [],
      });

      showToast("¡Partitura subida exitosamente!", "success", `"${data.titulo}" ya está disponible en la biblioteca.`);
      reset();
      setArchivoSeleccionado(null);
      setInstrumentosSeleccionados([]);
      setTimeout(() => navigate("/partituras"), 1500);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          showToast("Archivo duplicado", "warning", err.message || "No se puede subir la partitura porque este archivo ya fue subido previamente.");
          return;
        }
        showToast("No se pudo subir la partitura", "error", err.message);
      } else {
        showToast("No se pudo subir la partitura", "error", "Ocurrió un error inesperado.");
      }
    } finally {
      setEnviando(false);
    }
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <MainLayout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 max-w-sm rounded-lg px-4 py-3 shadow-lg ${
          toast.type === "success"
            ? "bg-green-600 text-white"
            : toast.type === "warning"
              ? "bg-amber-500 text-white"
              : "bg-destructive text-white"
        }`}>
          <p className="text-sm font-medium">{toast.msg}</p>
          {toast.desc && <p className="mt-0.5 text-xs opacity-90">{toast.desc}</p>}
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

        {/* Encabezado */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/partituras")}
            className="mb-6 flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Partituras
          </button>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 max-w-12 bg-secondary/40" />
            <span className="text-secondary text-lg">♪</span>
            <div className="h-px flex-1 max-w-12 bg-secondary/40" />
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold text-foreground">Subir Partitura</h1>
          <p className="mt-2 text-sm text-muted-foreground">Comparte tus partituras con la comunidad musical</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-secondary/20 bg-card p-8 shadow-sm space-y-7">

          {/* Sección: Información básica */}
          <SectionHeader icon={<BookOpen className="h-4 w-4" />} title="Información básica" />

          {/* Título */}
          <FormField label="Título de la partitura" error={errors.titulo?.message} required>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
              <input
                {...register("titulo")}
                placeholder="Ej: Sonata al Claro de Luna"
                className={inputClass(!!errors.titulo)}
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
          </FormField>

          {/* Autor */}
          <FormField label="Autor / Compositor" error={errors.autor?.message} required>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
              <input
                {...register("autor")}
                placeholder="Ej: Ludwig van Beethoven"
                className={inputClass(!!errors.autor)}
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
          </FormField>

          {/* Año y Género */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Año de composición" error={errors.anio?.message} required>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                <input
                  {...register("anio", { valueAsNumber: true })}
                  type="number"
                  placeholder="Ej: 1801"
                  min={1400}
                  max={new Date().getFullYear()}
                  className={inputClass(!!errors.anio)}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            </FormField>

            <FormField label="Género musical" error={errors.genero?.message} required>
              <div className="relative">
                <Music className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                <select
                  {...register("genero")}
                  className={selectClass(!!errors.genero)}
                  style={{ paddingLeft: "2.5rem" }}
                >
                  <option value="">Seleccionar género…</option>
                  {catalogoGeneros.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </FormField>
          </div>

          {/* Formato de agrupación */}
          <FormField label="Formato de agrupación" error={errors.formatoAgrupacion?.message} required>
            <div className="relative">
              <Music className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
              <select
                {...register("formatoAgrupacion")}
                className={selectClass(!!errors.formatoAgrupacion)}
                style={{ paddingLeft: "2.5rem" }}
              >
                <option value="">Seleccionar formato…</option>
                {catalogoFormatos.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </FormField>

          {/* Descripción */}
          <FormField label="Descripción" error={errors.descripcion?.message} hint="Opcional · máximo 500 caracteres">
            <textarea
              {...register("descripcion")}
              rows={3}
              placeholder="Breve descripción de la partitura, contexto histórico, nivel de dificultad…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none transition-colors"
            />
          </FormField>

          {/* Sección: Instrumentos */}
          <SectionHeader icon={<Music className="h-4 w-4" />} title="Instrumentos" />

          <div>
            <label className="mb-3 block text-sm font-medium text-foreground">
              Selecciona los instrumentos <span className="text-primary">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {catalogoInstrumentos.map((inst) => {
                const seleccionado = instrumentosSeleccionados.includes(inst);
                return (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => toggleInstrumento(inst)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      seleccionado
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-secondary/30 bg-background text-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {seleccionado && <Check className="h-3 w-3" />}
                    {inst}
                  </button>
                );
              })}
            </div>
            {instrumentoError && <p className="mt-1.5 text-xs text-destructive">{instrumentoError}</p>}
            {instrumentosSeleccionados.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Seleccionados: <span className="font-medium text-foreground">{instrumentosSeleccionados.join(", ")}</span>
              </p>
            )}
          </div>

          {/* Sección: Archivo PDF */}
          <SectionHeader icon={<FileText className="h-4 w-4" />} title="Archivo PDF" />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Archivo de la partitura <span className="text-primary">*</span>
            </label>
            <label
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging ? "border-primary bg-primary/5" :
                archivoSeleccionado ? "border-green-400 bg-green-50" :
                archivoError ? "border-destructive bg-destructive/5" :
                "border-secondary/30 bg-background hover:border-primary hover:bg-primary/5"
              }`}
            >
              {archivoSeleccionado ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{archivoSeleccionado.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(archivoSeleccionado.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setArchivoSeleccionado(null); }}
                    className="flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cambiar archivo
                  </button>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                    <Upload className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Arrastra el PDF aquí o{" "}
                      <span className="text-primary underline underline-offset-2">selecciona un archivo</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Solo archivos PDF · Máx. 20 MB</p>
                  </div>
                </>
              )}
              <input type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="sr-only" />
            </label>
            {archivoError && <p className="mt-1.5 text-xs text-destructive">{archivoError}</p>}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/partituras")}
              className="flex-1 rounded-lg border border-secondary/30 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid || enviando}
              className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Subiendo…
                </span>
              ) : "Subir Partitura"}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border ${hasError ? "border-destructive" : "border-input"} bg-background py-2.5 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors`;
}

function selectClass(hasError: boolean) {
  return `w-full rounded-lg border ${hasError ? "border-destructive" : "border-input"} bg-background py-2.5 pr-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors appearance-none`;
}

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-secondary/15 pb-3">
      <span className="text-secondary">{icon}</span>
      <h3 className="font-serif text-base font-semibold text-foreground">{title}</h3>
    </div>
  );
}

function FormField({ label, error, hint, required, children }: { label: string; error?: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-primary">*</span>}
        {hint && <span className="ml-auto text-xs font-normal text-muted-foreground">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default SubirPartitura;
