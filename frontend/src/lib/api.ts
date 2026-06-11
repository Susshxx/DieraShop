const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "http://localhost:5000/api");
const OAUTH_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "") || "http://localhost:5000";

const TOKEN_KEY = "diera_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export interface ApiUser {
  id: string;
  email: string;
  name?: string;
  role: "user" | "admin";
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });
  } catch {
    throw new Error("Cannot reach the API. Make sure the backend is running (npm run dev in backend/).");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || "Request failed");
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: ApiUser }>("/auth/login", { email, password }),
  sendOtp: (email: string, fullName: string, password: string) =>
    api.post<{ ok: boolean; devOtpLogged?: boolean; message?: string }>("/auth/send-otp", { email, fullName, password }),
  verifyOtp: (email: string, code: string) =>
    api.post<{ token: string; user: ApiUser }>("/auth/verify-otp", { email, code }),
  adminSignup: (data: { email: string; password: string; fullName: string; adminSignupCode: string }) =>
    api.post<{ token: string; user: ApiUser }>("/auth/admin/signup", data),
  me: () => api.get<{ user: ApiUser }>("/auth/me"),
  googleUrl: (redirect?: string) =>
    `${OAUTH_BASE}/api/auth/google${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`,
};

export const API_BASE = OAUTH_BASE;
