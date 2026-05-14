const trimTrailingSlash = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "");

const withApiPath = (value) => {
  const baseUrl = trimTrailingSlash(value);
  if (!baseUrl) {
    return "/api/v1";
  }

  return baseUrl.endsWith("/api/v1") ? baseUrl : `${baseUrl}/api/v1`;
};

const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "";

export const API_BASE_URL = rawApiBaseUrl
  ? withApiPath(rawApiBaseUrl)
  : "/api/v1";

const resolveSocketUrl = () => {
  const configuredSocketUrl =
    import.meta.env.VITE_SOCKET_URL || '';

  if (configuredSocketUrl) {
    return trimTrailingSlash(configuredSocketUrl);
  }

  try {
    const apiUrl = new URL(API_BASE_URL);
    return apiUrl.origin;
  } catch {
    return "/";
  }
};

export const SOCKET_URL = resolveSocketUrl();
