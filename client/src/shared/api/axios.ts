import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '../store/auth.store';
import { env } from '@/config/env';
import { navigateToLogin } from '../utils/router';

export const API_URL = env.NEXT_PUBLIC_API_URL;

// ---------------------------
// AXIOS INSTANCE
// ---------------------------
export const api = axios.create({
  baseURL: `${API_URL}/api/v1`, // example: https://api.myapp.com
  withCredentials: true, // optional, if using cookies
});

// ---------------------------
// SAFE HEADER HELPER
// ---------------------------
const setAuthHeader = (config: InternalAxiosRequestConfig, token: string) => {
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  }

  // Ensure headers are AxiosHeaders instance
  const headers = AxiosHeaders.from(config.headers);

  headers.set('Authorization', `Bearer ${token}`);

  config.headers = headers;
};
// ---------------------------
// REFRESH TOKEN (PLAIN AXIOS)
// ---------------------------
const refreshAccessToken = async (): Promise<string> => {
  // console.log('Refreshing access token...');
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`,
    {},
    { withCredentials: true }
  );

  // console.log({ response });

  const newToken = response.data.data.accessTokenJwt;
  // console.log({ newToken });

  useAuthStore.getState().updateAccessToken(newToken);

  return newToken;
};

// ---------------------------
// REFRESH STATE (QUEUE)
// ---------------------------
let isRefreshing = false;

let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

// ---------------------------
// REDIRECT GUARD (IMPORTANT FIX)
// ---------------------------
let hasRedirected = false;

// ✅ RESET FUNCTION (IMPORTANT FIX)
export const resetRedirectGuard = () => {
  hasRedirected = false;
};

const redirectToLoginOnce = () => {
  if (hasRedirected) return;

  hasRedirected = true;
  navigateToLogin();
};

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

// ---------------------------
// REQUEST INTERCEPTOR
// ---------------------------
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    console.log('In request interceptor', token);
    if (token) {
      setAuthHeader(config, token);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------
// RESPONSE INTERCEPTOR
// ---------------------------
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    console.log('In response interceptor');

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    console.log({ originalRequest });

    const status = error?.response?.status;

    console.log({ status });

    // ---------------------------
    // HANDLE 401
    // ---------------------------
    if (status === 401 && !originalRequest._retry) {
      console.log('Inside handle 401');
      // If refresh already in progress → queue request
      if (isRefreshing) {
        console.log('Refreshing in progress');
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              setAuthHeader(originalRequest, token);
              resolve(api(originalRequest));
            },
            reject: (err) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();

        // Resolve all queued requests
        processQueue(null, newToken);

        // Retry original request
        setAuthHeader(originalRequest, newToken);
        return api(originalRequest);
      } catch (err) {
        // logout user if refresh fails
        useAuthStore.getState().logout();
        processQueue(err, null);
        // ✅ SAFE SINGLE REDIRECT
        redirectToLoginOnce();

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
