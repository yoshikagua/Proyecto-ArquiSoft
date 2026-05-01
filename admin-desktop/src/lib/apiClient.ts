const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
    role?: string;
    role_id?: number;
  };
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

export interface ApiError {
  detail?: string;
  message?: string;
  status?: number;
}

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
    return { message: data.detail || data.message || "Error desconocido", status: response.status };
  } catch {
    return { message: `Error ${response.status}: ${response.statusText}`, status: response.status };
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = localStorage.getItem("auth_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const error = await handleErrorResponse(response);
      throw new ApiClientError(error.message || "Error en la solicitud", response.status, error);
    }
    if (response.status === 204) return {} as T;
    return await response.json();
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    if (error instanceof TypeError) {
      throw new ApiClientError("Error de conexión: No se pudo alcanzar el servidor", 0, {
        detail: (error as Error).message,
      });
    }
    throw new ApiClientError("Error desconocido", 0, { detail: String(error) });
  }
}

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

  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    return fetchApi<CurrentUserResponse>("/api/auth/me", { method: "GET" });
  },
};

export { API_BASE_URL };
