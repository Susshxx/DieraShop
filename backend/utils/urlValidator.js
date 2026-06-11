const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];

export const isPublicImageUrl = (urlString) => {
  try {
    const url = new URL(urlString);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    if (BLOCKED_HOSTS.includes(url.hostname)) return false;
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
};
