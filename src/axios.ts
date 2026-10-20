import axios from "axios";
import type {
  AxiosResponse,
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import type { AuthToken } from "./api/authApi";
import { readGuestGameSession } from "./guestSession";

type ApiError = {
  message: string;
  code: number;
  type?: string;
};

const TOKEN_STORAGE_KEY = "accessToken";
const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";
const USER_STORAGE_KEY = "authUser";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshRequest: Promise<string> | null = null;

const WITH_CREDENTIALS =
  String(import.meta.env.VITE_WITH_CREDENTIALS ?? "true").toLowerCase() ===
  "true";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 50000,
  responseEncoding: "utf8",
  withCredentials: WITH_CREDENTIALS,
});

function getAccessToken(): string {
  // Retrieve the token from local storage or any other secure storage
  return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

function getRefreshToken(): string {
  // Retrieve the refresh token from local storage or any other secure storage
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || "";
}

function getTokenValue(token: AuthToken | undefined): string {
  if (typeof token === "string") return token;
  return token?.token ?? "";
}

// Track whether a refresh is already in progress to avoid parallel refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config) => {
    config.headers["X-Requested-With"] = "XMLHttpRequest";
    config.headers["Accept"] = "application/json";
    config.headers["X-CSRF-TOKEN"] = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content");
    config.withCredentials = WITH_CREDENTIALS;
    // Add auth token if available
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const guestGameId = config.url?.match(/\/games\/guest\/([1-9]\d*)(?:\/|$)/)?.[1];
    const guestSession = guestGameId ? readGuestGameSession() : null;
    if (guestSession && guestSession.gameId === Number(guestGameId)) {
      config.headers.Authorization = `Bearer ${guestSession.token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;
    if (axios.isAxiosError<ApiError>(error) && error.response?.data?.type === "auth-conf") {
      error.message = `Erreur de configuration : ${
        error.response.data.message || "Une erreur est survenue."
      }`;
    }
    
    const request = originalRequest as RetryableRequestConfig | undefined;
    const isAuthRequest = request?.url?.includes("/auth/login") 
     || request?.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      request &&
      !request._retry &&
      !isAuthRequest &&
      Boolean(getAccessToken() || getRefreshToken())
    ) {
      request._retry = true;
      if (isRefreshing) {
        // Queue the request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            request.headers["Authorization"] = `Bearer ${token}`;
            return axiosInstance(request);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        refreshRequest ??= axiosInstance
          .post<{
            accessToken: AuthToken;
            refreshToken?: AuthToken;
          }>("/auth/refresh", {
            refreshToken: getRefreshToken(),
          })
          .then(({ data }) => {
            const accessToken = getTokenValue(data.accessToken);
            if (!accessToken) throw new Error("Le renouvellement de session n’a pas retourné de token.");
            if (data.refreshToken) {
              const refreshToken = getTokenValue(data.refreshToken);
              if (refreshToken) localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
            }
            localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
            window.dispatchEvent(new CustomEvent("auth:token-refreshed", { detail: accessToken }));
            return accessToken;
          })
          .finally(() => {
            refreshRequest = null;
          });

        const accessToken = await refreshRequest;
        request.headers.Authorization = `Bearer ${accessToken}`;
        
        processQueue(null, accessToken);
        return axiosInstance(request);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        window.dispatchEvent(new Event("auth:session-expired"));
        if (window.location.pathname !== "/auth") window.location.assign("/auth");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
