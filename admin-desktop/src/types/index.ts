export interface Comentario {
  id: string;
  usuario: string;
  avatar: string;
  texto: string;
  fecha: string;
}

export interface Partitura {
  id: string;
  uploadedBy?: string;
  titulo: string;
  autor: string;
  anio: number;
  genero: string;
  instrumentos: string[];
  likes: number;
  liked?: boolean;
  descargas: number;
  favorito: boolean;
  descripcion?: string;
  fileUrl?: string;
  comentarios: Comentario[];
}

export interface Instrumento {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  partiturasCount: number;
  imagen: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: "user" | "admin" | "superadmin";
  bio?: string;
}
