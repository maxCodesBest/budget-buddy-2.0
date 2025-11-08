import axios from "axios";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
export const http = axios.create({
  baseURL,
  withCredentials: true, // send refresh cookie
});

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

declare module "axios" {
  // Augment request config to carry our retry flag
  export interface InternalAxiosRequestConfig<D = any> {
    _retry?: boolean;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = http
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
    if (error?.response?.status === 401 && original && !original._retry) {
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
