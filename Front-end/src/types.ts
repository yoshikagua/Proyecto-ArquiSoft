/**
 * types.ts
 * Definición de tipos de datos principales usados en la aplicación.
 * Centraliza las interfaces para mantener consistencia entre páginas.
 */

/** Representa una partitura musical en la biblioteca */
export interface Partitura {
    id: string;
    titulo: string;
    autor: string;
    anio: number;
    /** Género musical (Clásico, Barroco, Romántico, etc.) */
    genero: string;
    /** Lista de instrumentos para los que está escrita */
    instrumentos: string[];
    /** Número de likes recibidos */
    likes: number;
    /** Indica si el usuario actual le dio like */
    liked?: boolean;
    /** Número de descargas */
    descargas: number;
    /** Indica si el usuario la ha marcado como favorita */
    favorito: boolean;
    /** Descripción breve de la partitura */
    descripcion: string;
    /** Lista de comentarios de usuarios */
    comentarios: Comentario[];
}

/** Comentario dejado por un usuario en una partitura */
export interface Comentario {
    id: string;
    usuario: string;
    /** Avatar del usuario (URL o inicial) */
    avatar: string;
    texto: string;
    /** Fecha en formato ISO */
    fecha: string;
}

/** Representa un instrumento musical en la biblioteca */
export interface Instrumento {
    id: string;
    nombre: string;
    /** Familia/categoría del instrumento (Cuerda, Viento, Percusión, etc.) */
    categoria: string;
    /** Descripción breve del instrumento */
    descripcion: string;
    /** Número de partituras disponibles para este instrumento */
    partiturasCount: number;
    /** Imágen ilustrativa (emoji o URL) */
    imagen: string;
}

/** Usuario registrado en la plataforma (para panel admin) */
export interface Usuario {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: "admin" | "user";
    bio?: string;
}
