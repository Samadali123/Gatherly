const REFRESH_TOKEN_KEY = 'refreshToken';

export const getStoredRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setStoredRefreshToken = (refreshToken) => {
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const clearStoredRefreshToken = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};
