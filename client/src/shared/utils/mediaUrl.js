import { SOCKET_URL } from '../../services/runtimeConfig';

const trimTrailingSlash = (value) => String(value || '').trim().replace(/\/+$/, '');

export const DEFAULT_PROFILE_IMAGE = '/images/default_dp.webp';

const isLegacyDefaultAvatar = (value) =>
  /dreamstime\.com\/b\/default-avatar-profile-icon/i.test(value) ||
  /imgs\.search\.brave\.com\/.*default/i.test(value) ||
  /pinimg\.com\/.*avatar/i.test(value);

export const resolveMediaUrl = (url) => {
  const rawValue = String(url || '').trim();
  const value = !rawValue || isLegacyDefaultAvatar(rawValue) ? DEFAULT_PROFILE_IMAGE : rawValue;

  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }

  if (value.startsWith('/images/')) {
    return `${window.location.origin}${value}`;
  }

  const baseUrl = trimTrailingSlash(SOCKET_URL && SOCKET_URL !== '/' ? SOCKET_URL : window.location.origin);
  return `${baseUrl}/${value.replace(/^\/+/, '')}`;
};
