import axios from "axios";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
// Primary client used across the app
export const http = axios.create({
  baseURL,
  withCredentials: true, // send refresh cookie
  timeout: 10000,
});

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Separate bare client for refresh calls (no interceptors to avoid loops)
const bare = axios.create({ baseURL, withCredentials: true, timeout: 10000 });

declare module "axios" {
  // Augment request config to carry our retry flag
  export interface InternalAxiosRequestConfig<D = any> {
    _retry?: boolean;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = bare
    .post("/auth/refresh")
    .then((res) => {
      const value = res.data?.value ?? res.data;
      const token = value?.accessToken as string | undefined;
      if (token) setAccessToken(token);
      return token || null;
    })
    .catch(() => null)
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  return refreshPromise;
}

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config as import("axios").InternalAxiosRequestConfig | undefined;
    const url = (original?.url || "") as string;
    // Do not attempt refresh for auth endpoints themselves
    const isAuthEndpoint = url.includes("/auth/refresh") || url.includes("/auth/sign-in");
    if (error?.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${token}`;
        return http.request(original);
      }
    }
    return Promise.reject(error);
  }
);
