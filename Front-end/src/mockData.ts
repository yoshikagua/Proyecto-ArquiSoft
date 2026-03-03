/**
 * mockData.ts
 * Datos de ejemplo (mock) para poblar las páginas mientras no hay backend conectado.
 * En producción, estos datos vendrían de llamadas a la API REST.
 */

import { Instrumento, Partitura } from "./types";

/** Lista de partituras de muestra */
export const PARTITURAS_MOCK: Partitura[] = [
    {
        id: "1",
        titulo: "Sonata al Claro de Luna",
        autor: "Ludwig van Beethoven",
        anio: 1801,
        genero: "Clásico",
        instrumentos: ["Piano"],
        likes: 348,
        descargas: 1204,
        favorito: false,
        descripcion:
            "La Sonata para piano n.º 14 en do sostenido menor, op. 27, n.º 2, conocida popularmente como Sonata al claro de luna.",
        comentarios: [
            {
                id: "c1",
                usuario: "María G.",
                avatar: "M",
                texto: "Una de mis favoritas. La toco todas las mañanas.",
                fecha: "2026-02-15T10:30:00Z",
            },
            {
                id: "c2",
                usuario: "Carlos R.",
                avatar: "C",
                texto: "La transcripción para guitarra es excelente.",
                fecha: "2026-02-20T14:00:00Z",
            },
        ],
    },
    {
        id: "2",
        titulo: "Clair de Lune",
        autor: "Claude Debussy",
        anio: 1905,
        genero: "Impresionista",
        instrumentos: ["Piano"],
        likes: 512,
        descargas: 2310,
        favorito: true,
        descripcion:
            "Clair de lune (Luna de plata) es la tercera pieza de la Suite Bergamasque de Claude Debussy.",
        comentarios: [
            {
                id: "c3",
                usuario: "Laura P.",
                avatar: "L",
                texto: "El mejor Debussy. Nunca me canso de escucharla.",
                fecha: "2026-01-10T09:15:00Z",
            },
        ],
    },
    {
        id: "3",
        titulo: "Cuatro Estaciones – Primavera",
        autor: "Antonio Vivaldi",
        anio: 1725,
        genero: "Barroco",
        instrumentos: ["Violín", "Orquesta de cuerdas"],
        likes: 290,
        descargas: 890,
        favorito: false,
        descripcion:
            "La Primavera es el primero de los cuatro conciertos para violín que componen el opus 8 de Vivaldi.",
        comentarios: [],
    },
    {
        id: "4",
        titulo: "Gymnopédie No. 1",
        autor: "Erik Satie",
        anio: 1888,
        genero: "Romántico",
        instrumentos: ["Piano"],
        likes: 420,
        descargas: 1567,
        favorito: false,
        descripcion:
            "La primera Gymnopédie es una composición para piano de Erik Satie, conocida por su carácter melancólico.",
        comentarios: [
            {
                id: "c4",
                usuario: "Andrés M.",
                avatar: "A",
                texto: "Perfecta para concentrarse estudiando.",
                fecha: "2026-03-01T20:00:00Z",
            },
        ],
    },
    {
        id: "5",
        titulo: "Balada No. 1 en Sol menor",
        autor: "Frédéric Chopin",
        anio: 1835,
        genero: "Romántico",
        instrumentos: ["Piano"],
        likes: 375,
        descargas: 1100,
        favorito: false,
        descripcion:
            "La Balada n.° 1 en sol menor, Op. 23, de Frédéric Chopin es una de las obras más conocidas del repertorio pianístico.",
        comentarios: [],
    },
    {
        id: "6",
        titulo: "Concierto para violonchelo en Mi menor",
        autor: "Edward Elgar",
        anio: 1919,
        genero: "Romántico",
        instrumentos: ["Violonchelo", "Orquesta"],
        likes: 210,
        descargas: 645,
        favorito: false,
        descripcion:
            "El Concierto para violonchelo en mi menor es una obra compuesta por Edward Elgar en 1919.",
        comentarios: [],
    },
];

/** Lista de instrumentos de muestra */
export const INSTRUMENTOS_MOCK: Instrumento[] = [
    {
        id: "i1",
        nombre: "Piano",
        categoria: "Teclado",
        descripcion:
            "Instrumento de cuerda percutida con teclado. El instrumento con más repertorio en la biblioteca.",
        partiturasCount: 312,
        imagen: "🎹",
    },
    {
        id: "i2",
        nombre: "Violín",
        categoria: "Cuerda",
        descripcion:
            "Instrumento de cuerda frotada con arco. La voz más soprano de la familia de las cuerdas.",
        partiturasCount: 198,
        imagen: "🎻",
    },
    {
        id: "i3",
        nombre: "Guitarra",
        categoria: "Cuerda",
        descripcion:
            "Instrumento de cuerda pulsada. Amplia variedad de estilos desde clásico hasta flamenco.",
        partiturasCount: 245,
        imagen: "🎸",
    },
    {
        id: "i4",
        nombre: "Flauta",
        categoria: "Viento madera",
        descripcion:
            "Instrumento de viento madera. El timbre más agudo y cristalino de la orquesta.",
        partiturasCount: 87,
        imagen: "🎵",
    },
    {
        id: "i5",
        nombre: "Trompeta",
        categoria: "Viento metal",
        descripcion:
            "Instrumento de viento metal. Presente en música clásica, jazz y bandas.",
        partiturasCount: 64,
        imagen: "🎺",
    },
    {
        id: "i6",
        nombre: "Violonchelo",
        categoria: "Cuerda",
        descripcion:
            "Instrumento de cuerda frotada. Voz tenor/bajo de la familia de las cuerdas.",
        partiturasCount: 112,
        imagen: "🎻",
    },
    {
        id: "i7",
        nombre: "Saxofón",
        categoria: "Viento madera",
        descripcion:
            "Instrumento de viento madera con boquilla de caña. Esencial en el jazz y la música popular.",
        partiturasCount: 73,
        imagen: "🎷",
    },
    {
        id: "i8",
        nombre: "Percusión",
        categoria: "Percusión",
        descripcion:
            "Familia de instrumentos que se tocan golpeando. Desde timbales de orquesta hasta batería.",
        partiturasCount: 45,
        imagen: "🥁",
    },
];

/** Géneros musicales disponibles como filtro */
export const GENEROS = [
    "Todos",
    "Barroco",
    "Clásico",
    "Romántico",
    "Impresionista",
    "Contemporáneo",
    "Jazz",
    "Popular",
];

/** Categorías de instrumentos disponibles como filtro */
export const CATEGORIAS_INSTRUMENTO = [
    "Todas",
    "Teclado",
    "Cuerda",
    "Viento madera",
    "Viento metal",
    "Percusión",
    "Voz",
];
