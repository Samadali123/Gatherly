import axios from 'axios';
import { useAuthStore } from '../features/auth/authStore';
import { clearStoredRefreshToken, getStoredRefreshToken, setStoredRefreshToken } from '../features/auth/tokenStorage';
import { disconnectSocket, setSocketRefreshHandler } from './socket';
import { API_BASE_URL } from './runtimeConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const ANON_SESSION_PREFIX = 'gatherly:anon-session:';

const encodeAnonSession = (session) => {
  try {
    return window.btoa(JSON.stringify(session));
  } catch {
    return '';
  }
};

const decodeAnonSession = (value) => {
  try {
    return JSON.parse(window.atob(value));
  } catch {
    return null;
  }
};

const getRoomCodeFromUrl = (url = '') => {
  const match = String(url).match(/\/rooms\/([^/?#]+)/);
  return match?.[1] || null;
};

export const storeAnonRoomSession = (roomCode, session) => {
  if (!roomCode || !session) {
    return;
  }

  localStorage.setItem(`${ANON_SESSION_PREFIX}${roomCode}`, encodeAnonSession(session));
};

export const getStoredAnonRoomSession = (roomCode) => {
  if (!roomCode) {
    return null;
  }

  const encoded = localStorage.getItem(`${ANON_SESSION_PREFIX}${roomCode}`);
  return encoded ? decodeAnonSession(encoded) : null;
};

export const clearStoredAnonRoomSession = (roomCode) => {
  if (roomCode) {
    localStorage.removeItem(`${ANON_SESSION_PREFIX}${roomCode}`);
  }
};

let isRefreshing = false;
let failedQueue = [];
let refreshPromise = null;
let sessionInvalidated = false;

const endAuthSession = () => {
  if (sessionInvalidated) {
    return;
  }

  sessionInvalidated = true;
  useAuthStore.getState().clearAuth();
  clearStoredRefreshToken();
  disconnectSocket();

  if (!['/login', '/register'].includes(window.location.pathname)) {
    window.location.assign('/login');
  }
};

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
  if (sessionInvalidated) {
    const error = new Error('Please sign in again.');
    error.statusCode = 401;
    throw error;
  }

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

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, { withCredentials: true });

    const accessToken = response.data?.data?.accessToken || null;
    const newRefreshToken = response.data?.data?.refreshToken || null;

    if (accessToken) {
      sessionInvalidated = false;
      useAuthStore.getState().setAccessToken(accessToken);
    }
    if (newRefreshToken) {
      setStoredRefreshToken(newRefreshToken);
    }

    return accessToken;
  })();

  try {
    return await refreshPromise;
  } catch (error) {
    if (error.response?.status === 401 || error.statusCode === 401) {
      endAuthSession();
    }
    throw error;
  } finally {
    refreshPromise = null;
  }
};

setSocketRefreshHandler(async () => {
  try {
    return await refreshAccessToken();
  } catch (error) {
    endAuthSession();
    throw error;
  }
});

api.interceptors.request.use((config) => {
<<<<<<< HEAD
  const token = sessionInvalidated ? null : useAuthStore.getState().accessToken;
=======
  config.headers = config.headers || {};
  const token = useAuthStore.getState().accessToken;
>>>>>>> d31212618874aadfaf24e00d1a37e4d63399429f
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const roomCode = getRoomCodeFromUrl(config.url);
  const anonSession = roomCode ? localStorage.getItem(`${ANON_SESSION_PREFIX}${roomCode}`) : null;
  if (anonSession) {
    config.headers['X-Anon-Session'] = anonSession;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const requestUrl = response.config?.url || '';
    if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register')) {
      sessionInvalidated = false;
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    if (error.response?.status === 401 && requestUrl.includes('/auth/refresh')) {
      endAuthSession();
      return Promise.reject(error);
    }

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
        endAuthSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
