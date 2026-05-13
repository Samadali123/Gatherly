const normalizePhone = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const plus = raw.startsWith('+') ? '+' : '';
  return plus + raw.replace(/[^\d]/g, '');
};

const looksLikePhone = (value = '') => /[0-9]/.test(value) && !String(value).includes('@');

module.exports = {
  looksLikePhone,
  normalizePhone,
};
