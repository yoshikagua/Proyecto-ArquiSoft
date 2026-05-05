/**
 * EditarPartitura.tsx
 * Formulario para editar la información de una partitura existente.
 *
 * Campos editables:
 * - Título
 * - Autor / Compositor
 * - Año de composición
 * - Género musical
 * - Formato de agrupación
 * - Instrumentos
 * - Descripción
 */

import { useState, useEffect, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    BookOpen,
    User,
    Calendar,
    Music,
    Check,
    ArrowLeft,
    Save
} from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { toast } from "sonner";
import { storageApi, ApiClientError } from "@/lib/apiClient";
import { usePartituras } from "@/context/PartiturasContext";
import { useAuth } from "@/context/AuthContext";

/* ─────────────────────────────────────────────
   Esquema de validación con Zod
───────────────────────────────────────────── */

const editarPartituraSchema = z.object({
    titulo: z
        .string()
        .trim()
        .min(2, "El título debe tener al menos 2 caracteres")
        .max(120, "El título no puede superar 120 caracteres"),
    autor: z
        .string()
        .trim()
        .min(2, "Ingresa el nombre del autor/compositor")
        .max(80, "El nombre no puede superar 80 caracteres"),
    anio: z
        .number()
        .int()
        .min(1400, "El año debe ser posterior a 1400")
        .max(new Date().getFullYear(), "El año no puede ser futuro"),
    formatoAgrupacion: z.string().min(1, "Selecciona el formato de agrupación"),
    genero: z.string().min(1, "Selecciona un género musical"),
    descripcion: z.string().max(500, "Máximo 500 caracteres").optional(),
});

type EditarPartituraData = z.infer<typeof editarPartituraSchema>;

/* ─────────────────────────────────────────────
   Componente principal
───────────────────────────────────────────── */

const EditarPartitura = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { partituras, updatePartitura } = usePartituras();
    const { user } = useAuth();

    // Partitura base a editar
    const partitura = partituras.find((p) => p.id === id);

    // ── Estado para instrumentos seleccionados ──
    const [instrumentosSeleccionados, setInstrumentosSeleccionados] = useState<string[]>([]);
    const [instrumentoError, setInstrumentoError] = useState("");

    // ── Catálogos ──
    const [catalogoGeneros, setCatalogoGeneros] = useState<string[]>([]);
    const [catalogoInstrumentos, setCatalogoInstrumentos] = useState<string[]>([]);
    const [catalogoFormatos, setCatalogoFormatos] = useState<string[]>([]);

    // ── Estado de envío ──
    const [guardando, setGuardando] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isDirty },
        reset,
    } = useForm<EditarPartituraData>({
        resolver: zodResolver(editarPartituraSchema),
        mode: "onChange",
    });

    // Cargar datos iniciales
    useEffect(() => {
        if (partitura) {
            // Verificar permisos (solo el creador puede editar)
            if (!user || (user.id?.toString() !== partitura.uploadedBy && partitura.uploadedBy !== user.email)) {
                toast.error("No tienes permisos para editar esta partitura");
                navigate(`/partituras/${id}`);
                return;
            }

            reset({
                titulo: partitura.titulo,
                autor: partitura.autor,
                anio: partitura.anio,
                formatoAgrupacion: "Banda sinfónica",
                genero: partitura.genero,
                descripcion: partitura.descripcion,
            });
            setInstrumentosSeleccionados(partitura.instrumentos || []);
        }
    }, [partitura, reset, user, navigate, id]);

    useEffect(() => {
        const loadCatalog = async () => {
            try {
                const catalog = await storageApi.getCatalog();
                setCatalogoGeneros(catalog.genres || []);
                setCatalogoInstrumentos(catalog.instruments || []);
                setCatalogoFormatos(catalog.formats || []);
            } catch {
                toast.error("No se pudo cargar el catálogo", {
                    description: "Intenta nuevamente en unos segundos.",
                });
            }
        };

        void loadCatalog();
    }, []);

    /* ── Partitura no encontrada ── */
    if (!partitura) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center gap-4 py-40 text-center">
                    <BookOpen className="h-16 w-16 text-secondary/40" />
                    <div>
                        <p className="font-serif text-2xl text-foreground">
                            Partitura no encontrada
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/partituras")}
                        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                        Volver a Partituras
                    </button>
                </div>
            </MainLayout>
        );
    }

    /* ─── Manejo de instrumentos ─── */

    const toggleInstrumento = (nombre: string) => {
        setInstrumentosSeleccionados((prev) => {
            const actualizado = prev.includes(nombre)
                ? prev.filter((i) => i !== nombre)
                : [...prev, nombre];
            if (actualizado.length > 0) setInstrumentoError("");
            return actualizado;
        });
    };

    /* ─── Envío del formulario ─── */

    const onSubmit = async (data: EditarPartituraData) => {
        if (instrumentosSeleccionados.length === 0) {
            setInstrumentoError("Selecciona al menos un instrumento.");
            return;
        }

        setGuardando(true);

        try {
            await updatePartitura(partitura.id, {
                title: data.titulo,
                composer: data.autor,
                genre: data.genero,
                format_type: data.formatoAgrupacion,
                year: data.anio,
                description: data.descripcion || "",
                instruments: instrumentosSeleccionados,
            });

            toast.success("¡Partitura actualizada exitosamente!", {
                description: `Los cambios en "${data.titulo}" se han guardado.`,
            });

            navigate(`/partituras/${partitura.id}`);
        } catch (err) {
            if (err instanceof ApiClientError) {
                toast.error("No se pudieron guardar los cambios", {
                    description: err.message,
                });
            } else {
                toast.error("Ocurrió un error inesperado al actualizar.");
            }
        } finally {
            setGuardando(false);
        }
    };

    const hayCambios = isDirty ||
        JSON.stringify(instrumentosSeleccionados.slice().sort()) !== JSON.stringify([...(partitura.instrumentos || [])].sort());

    return (
        <MainLayout>
            <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
                {/* ── Encabezado ── */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(`/partituras/${partitura.id}`)}
                        className="mb-6 flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Cancelar edición
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 max-w-12 bg-secondary/40" />
                        <span className="text-secondary text-lg">✎</span>
                        <div className="h-px flex-1 max-w-12 bg-secondary/40" />
                    </div>
                    <h1 className="mt-3 font-serif text-3xl font-bold text-foreground">
                        Editar Partitura
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Modifica la información de "{partitura.titulo}"
                    </p>
                </div>

                {/* ── Formulario ── */}
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="rounded-2xl border border-secondary/20 bg-card p-8 shadow-sm space-y-7"
                >
                    {/* ══ Sección 1: Información básica ══ */}
                    <SectionHeader icon={<BookOpen className="h-4 w-4" />} title="Información básica" />

                    <FormField label="Título de la partitura" error={errors.titulo?.message} required>
                        <div className="relative">
                            <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                            <input
                                {...register("titulo")}
                                className={inputClass(!!errors.titulo)}
                                style={{ paddingLeft: "2.5rem" }}
                            />
                        </div>
                    </FormField>

                    <FormField label="Autor / Compositor" error={errors.autor?.message} required>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                            <input
                                {...register("autor")}
                                className={inputClass(!!errors.autor)}
                                style={{ paddingLeft: "2.5rem" }}
                            />
                        </div>
                    </FormField>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <FormField label="Año de composición" error={errors.anio?.message} required>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                                <input
                                    {...register("anio", { valueAsNumber: true })}
                                    type="number"
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
                                    {catalogoGeneros.map((g) => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>
                        </FormField>
                    </div>

                    <FormField label="Formato de agrupación" error={errors.formatoAgrupacion?.message} required>
                        <div className="relative">
                            <Music className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                            <select
                                {...register("formatoAgrupacion")}
                                className={selectClass(!!errors.formatoAgrupacion)}
                                style={{ paddingLeft: "2.5rem" }}
                            >
                                <option value="">Seleccionar formato…</option>
                                {catalogoFormatos.map((formato) => (
                                    <option key={formato} value={formato}>{formato}</option>
                                ))}
                            </select>
                        </div>
                    </FormField>

                    <FormField label="Descripción" error={errors.descripcion?.message}>
                        <textarea
                            {...register("descripcion")}
                            rows={3}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 resize-none transition-colors"
                        />
                    </FormField>

                    {/* ══ Sección 2: Instrumentos ══ */}
                    <SectionHeader icon={<Music className="h-4 w-4" />} title="Instrumentos" />

                    <div>
                        <div className="flex flex-wrap gap-2">
                            {catalogoInstrumentos.map((inst) => {
                                const seleccionado = instrumentosSeleccionados.includes(inst);
                                return (
                                    <button
                                        key={inst}
                                        type="button"
                                        onClick={() => toggleInstrumento(inst)}
                                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${seleccionado
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
                    </div>

                    {/* ══ Botones de acción ══ */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate(`/partituras/${partitura.id}`)}
                            className="flex-1 rounded-lg border border-secondary/30 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/10"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={!isValid || !hayCambios || guardando}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
                        >
                            {guardando ? (
                                "Guardando…"
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
};

/* ─────────────────────────────────────────────
   Helpers de estilo y sub-componentes
───────────────────────────────────────────── */

function inputClass(hasError: boolean) {
    return `w-full rounded-lg border ${hasError ? "border-destructive" : "border-input"
        } bg-background py-2.5 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors`;
}

function selectClass(hasError: boolean) {
    return `w-full rounded-lg border ${hasError ? "border-destructive" : "border-input"
        } bg-background py-2.5 pr-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors appearance-none`;
}

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2 border-b border-secondary/15 pb-3">
            <span className="text-secondary">{icon}</span>
            <h3 className="font-serif text-base font-semibold text-foreground">{title}</h3>
        </div>
    );
}

function FormField({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-sm font-medium text-foreground">
                {label}
                {required && <span className="text-primary">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

export default EditarPartitura;
