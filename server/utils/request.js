const parseCookieHeader = (cookieHeader = '') =>
  cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((accumulator, part) => {
      const separatorIndex = part.indexOf('=');

      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = part.slice(0, separatorIndex);
      const value = part.slice(separatorIndex + 1);
      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});

const getCookieValue = (req, cookieName) => {
  if (req.cookies && req.cookies[cookieName]) {
    return req.cookies[cookieName];
  }

  if (req.signedCookies && req.signedCookies[cookieName]) {
    return req.signedCookies[cookieName];
  }

  const cookieHeader = req.headers.cookie || '';
  const cookies = parseCookieHeader(cookieHeader);
  return cookies[cookieName] || null;
};

module.exports = {
  parseCookieHeader,
  getCookieValue,
};
