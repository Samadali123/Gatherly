const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlash(
   import.meta.env.REACT_APP_API_BASE_URL || '/api/v1'
);

const resolveSocketUrl = () => {
  const configuredSocketUrl = import.meta.env.REACT_APP_SOCKET_URL;
  if (configuredSocketUrl) {
    return trimTrailingSlash(configuredSocketUrl);
  }

  try {
    const apiUrl = new URL(API_BASE_URL);
    return apiUrl.origin;
  } catch {
    return '/';
  }
};

export const SOCKET_URL = resolveSocketUrl();
