import { io } from 'socket.io-client';
import { useAuthStore } from '../features/auth/authStore';
import { SOCKET_URL } from './runtimeConfig';

let socket;
let refreshHandler = null;

export const setSocketRefreshHandler = (handler) => {
  refreshHandler = handler;
};

const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
    });
  }

  return socket;
};

export const connectSocket = async (token) => {
  const instance = getSocket();
  instance.auth = { token };

  if (!instance.connected) {
    instance.connect();
  }

  return instance;
};

export const disconnectSocket = () => {
  const instance = getSocket();
  if (instance.connected) {
    instance.disconnect();
  }
};

const instance = getSocket();

instance.on('connect_error', async (error) => {
  if (error?.message !== 'TOKEN_EXPIRED' || !refreshHandler) {
    return;
  }

  try {
    const accessToken = await refreshHandler();
    if (!accessToken) {
      return;
    }

    instance.auth = { token: accessToken };
    useAuthStore.getState().setAccessToken(accessToken);
    instance.connect();
  } catch {
    disconnectSocket();
  }
});

export { instance as socket };
