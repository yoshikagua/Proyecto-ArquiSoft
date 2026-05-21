/**
 * apiClient.ts (Versión Escritorio / Admin)
 * Cliente HTTP centralizado para la API del gateway.
 * * Optimizado para administradores: incluye login, gestión de usuarios, 
 * y control total del almacenamiento (Storage), omitiendo registro y recuperación.
 */

// En Tauri dev:        Vite proxy intercepta /api/* → desktop-proxy (4443) → gateway
// En Tauri producción: requests van a https://localhost:4443 → desktop-proxy → gateway
const API_BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "" : "https://localhost:4443");

// ==========================================
// INTERFACES
// ==========================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token?: string;
  token?: string;
  token_type?: string;
  user?: {
    id?: string | number;
    email: string;
    first_name?: string;
    last_name?: string;
    nombre?: string;
    role?: string;
    role_id?: number;
  };
}

export interface LogoutResponse {
  message: string;
}

export interface HealthCheckResponse {
  status: string;
  user_api_url?: string;
  frontend_url?: string;
}

export interface CurrentUserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role_id?: number;
  role_name?: string;
  profile_info?: string | null;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  profile_info?: string;
  role_id?: number;
}

export interface UserListItem {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  role_name: string;
  profile_info?: string | null;
}

export interface UploadScoreRequest {
  title: string;
  composer: string;
  genre: string;
  format_type: string;
  year: number;
  description?: string;
  instruments?: string[];
  file: File;
}

export interface UpdateScoreRequest {
  id: string;
  title: string;
  composer: string;
  genre: string;
  format_type: string;
  year: number;
  description?: string;
  instruments?: string[];
}

export interface StorageScore {
  id: string;
  title: string;
  composer: string;
  genre: string;
  format: string;
  year: number;
  uploaded_by: string;
  file_url: string;
  description: string;
  instruments: string[];
  likes: number;
  downloads: number;
  favorito: boolean;
  liked: boolean;
  comentarios: StorageComment[];
}

export interface StorageComment {
  id: string;
  usuario: string;
  avatar: string;
  texto: string;
  fecha: string;
}

export interface StorageScoreCatalog {
  genres: string[];
  instruments: string[];
  formats: string[];
}

export interface ApiError {
  detail?: string;
  message?: string;
  status?: number;
}

// ==========================================
// MANEJO DE ERRORES Y UTILIDADES
// ==========================================

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public details: ApiError
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function handleErrorResponse(response: Response): Promise<ApiError> {
  try {
    const data = await response.json();
    return {
      message: data.detail || data.message || "Error desconocido",
      status: response.status,
    };
  } catch {
    return {
      message: `Error ${response.status}: ${response.statusText}`,
      status: response.status,
    };
  }
}

function getAuthToken(): string | null {
  const token = localStorage.getItem("auth_token") || localStorage.getItem("access_token");
  if (!token || token === "undefined" || token === "null") {
    return null;
  }
  return token;
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await handleErrorResponse(response);
      throw new ApiClientError(error.message || "Error en la solicitud", response.status, error);
    }

    const contentType = response.headers.get("content-type");
    if (response.status === 204 || !contentType || contentType.indexOf("application/json") === -1) {
      return {} as T;
    }

    try {
      return await response.json();
    } catch (e) {
      console.warn("Error parseando JSON de respuesta exitosa:", e);
      return {} as T;
    }
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    if (error instanceof TypeError) {
      throw new ApiClientError("Error de conexión: No se pudo alcanzar el servidor", 0, { detail: (error as Error).message });
    }
    throw new ApiClientError("Error desconocido", 0, { detail: String(error) });
  }
}

async function fetchStorageGraphQL<TData>(
  query: string,
  variables: Record<string, unknown>,
  requireAuth = false
): Promise<TData> {
  const token = getAuthToken();
  if (requireAuth && !token) {
    throw new ApiClientError("Debes iniciar sesión para realizar esta acción", 401, { message: "No autenticado" });
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api/storage`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const error = await handleErrorResponse(response);
    throw new ApiClientError(error.message || "Error en storage", response.status, error);
  }

  const body = await response.json();
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    throw new ApiClientError(body.errors[0]?.message || "Error de GraphQL", 400, { message: body.errors[0]?.message });
  }

  return body.data as TData;
}

// ==========================================
// API DE AUTENTICACIÓN (ADMIN)
// ==========================================

export const authApi = {
  login: async (request: LoginRequest): Promise<LoginResponse> => {
    const raw = await fetchApi<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(request),
    });
    return {
      ...raw,
      access_token: raw.access_token || raw.token,
      token_type: raw.token_type || "bearer",
    };
  },

  logout: async (): Promise<LogoutResponse> => {
    return fetchApi<LogoutResponse>("/api/auth/logout", { method: "POST" });
  },

  getCurrentUser: async () => {
    return fetchApi<CurrentUserResponse>("/api/auth/me", { method: "GET" });
  },

  updateUser: async (userId: number, request: UpdateUserRequest) => {
    return fetchApi<{ message?: string }>(`/api/auth/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  },

  getUsers: async (limit = 50, offset = 0) => {
    return fetchApi<UserListItem[]>(`/api/auth/users?limit=${limit}&offset=${offset}`, {
      method: "GET",
    });
  },

  health: async (): Promise<HealthCheckResponse> => {
    return fetchApi<HealthCheckResponse>("/api/auth/health", { method: "GET" });
  },
};

// ==========================================
// API DE STORAGE (ADMIN)
// ==========================================

export const storageApi = {
  getScores: async (): Promise<StorageScore[]> => {
    const data = await fetchStorageGraphQL<{ scores: StorageScore[] }>(
      `
      query GetScores {
        scores {
          id title composer genre format year uploadedBy fileUrl description
          instruments likes downloads favorito liked
          comentarios { id usuario avatar texto fecha }
        }
      }
      `,
      {},
      false
    );
    return (data.scores || []).map((score) => ({
      ...score,
      uploaded_by: (score as unknown as { uploadedBy?: string }).uploadedBy || score.uploaded_by,
      file_url: (score as unknown as { fileUrl?: string }).fileUrl || score.file_url,
    }));
  },

  getCatalog: async (): Promise<StorageScoreCatalog> => {
    const data = await fetchStorageGraphQL<{
      scoreGenres: string[];
      scoreInstruments: string[];
      scoreFormats: string[];
    }>(
      `
      query GetScoreCatalog {
        scoreGenres scoreInstruments scoreFormats
      }
      `,
      {},
      false
    );
    return {
      genres: data.scoreGenres || [],
      instruments: data.scoreInstruments || [],
      formats: data.scoreFormats || [],
    };
  },

  uploadScore: async (request: UploadScoreRequest): Promise<StorageScore> => {
    const token = getAuthToken();
    if (!token) throw new ApiClientError("Sesión requerida", 401, { message: "No autenticado" });

    const formData = new FormData();
    formData.append("title", request.title);
    formData.append("composer", request.composer);
    formData.append("genre", request.genre);
    formData.append("format_type", request.format_type);
    formData.append("year", request.year.toString());
    formData.append("description", request.description || "");
    formData.append("instruments", JSON.stringify(request.instruments || []));
    formData.append("file", request.file);

    const response = await fetch(`${API_BASE_URL}/api/storage/upload-score`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }, // Fetch maneja automáticamente el Content-Type para FormData
      body: formData,
    });

    if (!response.ok) {
      const error = await handleErrorResponse(response);
      throw new ApiClientError(error.message || "Error al subir", response.status, error);
    }

    const result = await response.json();
    const score = result.data.uploadScore;
    return { ...score, uploaded_by: score.uploadedBy, file_url: score.fileUrl } as StorageScore;
  },

  updateScore: async (request: UpdateScoreRequest): Promise<StorageScore> => {
    const data = await fetchStorageGraphQL<{ updateScore: StorageScore }>(
      `
      mutation UpdateScore(
        $id: String! $title: String! $composer: String! $genre: String!
        $format: String! $year: Int! $description: String! $instruments: [String!]
      ) {
        updateScore(
          id: $id title: $title composer: $composer genre: $genre
          format: $format year: $year description: $description instruments: $instruments
        ) {
          id title composer genre format year uploadedBy fileUrl description
          instruments likes downloads favorito liked
          comentarios { id usuario avatar texto fecha }
        }
      }
      `,
      {
        id: request.id, title: request.title, composer: request.composer,
        genre: request.genre, format: request.format_type, year: request.year,
        description: request.description || "", instruments: request.instruments || [],
      },
      true
    );

    return {
      ...data.updateScore,
      uploaded_by: (data.updateScore as unknown as { uploadedBy?: string }).uploadedBy || data.updateScore.uploaded_by,
      file_url: (data.updateScore as unknown as { fileUrl?: string }).fileUrl || data.updateScore.file_url,
    };
  },

  deleteScore: async (id: string): Promise<{ message?: string }> => {
    return fetchApi<{ message?: string }>(`/api/storage/remove/${id}`, {
      method: "DELETE",
    });
  },

  // Aunque es una app admin, conservamos estas interacciones por si el admin necesita moderar o probar flujos
  toggleLike: async (scoreId: string): Promise<StorageScore> => {
    const data = await fetchStorageGraphQL<{ toggleLike: StorageScore }>(
      `mutation ToggleLike($id: String!) { toggleLike(id: $id) { id likes liked } }`,
      { id: scoreId }, true
    );
    return data.toggleLike;
  },

  toggleFavorite: async (scoreId: string): Promise<StorageScore> => {
    const data = await fetchStorageGraphQL<{ toggleFavorite: StorageScore }>(
      `mutation ToggleFavorite($id: String!) { toggleFavorite(id: $id) { id favorito } }`,
      { id: scoreId }, true
    );
    return data.toggleFavorite;
  },

  addComment: async (scoreId: string, payload: { texto: string; usuario: string; avatar: string }): Promise<StorageScore> => {
    const data = await fetchStorageGraphQL<{ addComment: StorageScore }>(
      `mutation AddComment($id: String!, $texto: String!, $usuario: String!, $avatar: String!) {
        addComment(id: $id, texto: $texto, usuario: $usuario, avatar: $avatar) { id comentarios { id texto } }
      }`,
      { id: scoreId, ...payload }, true
    );
    return data.addComment;
  },

  registerDownload: async (scoreId: string): Promise<StorageScore> => {
    const data = await fetchStorageGraphQL<{ registerDownload: StorageScore }>(
      `mutation RegisterDownload($id: String!) { registerDownload(id: $id) { id downloads } }`,
      { id: scoreId }, false
    );
    return data.registerDownload;
  },
};

export { API_BASE_URL };