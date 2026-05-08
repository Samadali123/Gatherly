import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { connectSocket, disconnectSocket, socket } from '../../../services/socket';
import { useAuthStore } from '../authStore';
import { clearStoredRefreshToken, getStoredRefreshToken, setStoredRefreshToken } from '../tokenStorage';

export const useAuth = () => {
  const { user, accessToken, initialized, setAuth, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const login = async (payload) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', payload);
      const authPayload = response.data.data;
      setStoredRefreshToken(authPayload.refreshToken);
      setAuth(authPayload);
      await connectSocket(authPayload.accessToken);
      socket.emit('join-server');
      return authPayload;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', payload);
      const authPayload = response.data.data;
      setStoredRefreshToken(authPayload.refreshToken);
      setAuth(authPayload);
      await connectSocket(authPayload.accessToken);
      socket.emit('join-server');
      return authPayload;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = getStoredRefreshToken();

    try {
      if (accessToken || refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } finally {
      disconnectSocket();
      clearStoredRefreshToken();
      clearAuth();
      window.location.assign('/login');
    }
  };

  return {
    user,
    accessToken,
    initialized,
    loading,
    login,
    register,
    logout,
  };
};

export const useAuthBootstrap = () => {
  const { initialized, setAuth, markInitialized } = useAuthStore();

  useEffect(() => {
    if (initialized) {
      return undefined;
    }

    let active = true;

    const restore = async () => {
      const refreshToken = getStoredRefreshToken();

      if (!refreshToken) {
        markInitialized();
        return;
      }

      try {
        const refreshResponse = await api.post('/auth/refresh', { refreshToken });
        const refreshedToken = refreshResponse.data.data.accessToken;
        const refreshedRefreshToken = refreshResponse.data.data.refreshToken;
        const refreshedUser = refreshResponse.data.data.user;

        if (!active) {
          return;
        }

        setStoredRefreshToken(refreshedRefreshToken);
        setAuth({
          accessToken: refreshedToken,
          user: refreshedUser,
        });

        await connectSocket(refreshedToken);
        socket.emit('join-server');
      } catch {
        if (active) {
          clearStoredRefreshToken();
          markInitialized();
        }
      }
    };

    restore();

    return () => {
      active = false;
    };
  }, [initialized, markInitialized, setAuth]);
};
