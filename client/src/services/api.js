import axios from 'axios';
import { useAuthStore } from '../features/auth/authStore';
import { clearStoredRefreshToken, getStoredRefreshToken, setStoredRefreshToken } from '../features/auth/tokenStorage';
import { disconnectSocket, setSocketRefreshHandler } from './socket';

const api = axios.create({
  baseURL: '/api/v1',
});

let isRefreshing = false;
let failedQueue = [];
let refreshPromise = null;

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

export const refreshAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
      const error = new Error('Refresh token missing');
      error.statusCode = 401;
      throw error;
    }

    const response = await axios.post('/api/v1/auth/refresh', { refreshToken });

    const accessToken = response.data?.data?.accessToken || null;
    const newRefreshToken = response.data?.data?.refreshToken || null;

    if (accessToken) {
      useAuthStore.getState().setAccessToken(accessToken);
    }
    if (newRefreshToken) {
      setStoredRefreshToken(newRefreshToken);
    }

    return accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

setSocketRefreshHandler(async () => {
  try {
    return await refreshAccessToken();
  } catch (error) {
    useAuthStore.getState().clearAuth();
    clearStoredRefreshToken();
    disconnectSocket();
    window.location.assign('/login');
    throw error;
  }
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !requestUrl.includes('/auth/login') &&
      !requestUrl.includes('/auth/register') &&
      !requestUrl.includes('/auth/refresh') &&
      getStoredRefreshToken()
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const accessToken = await refreshAccessToken();
        processQueue(null, accessToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        clearStoredRefreshToken();
        disconnectSocket();
        window.location.assign('/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
