import { verifyTokenString } from '../utils/jwt.js';

export const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  const cookieToken = req.cookies?.token;
  const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : cookieToken;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = verifyTokenString(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

export const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : req.cookies?.token;
  if (!token) return next();
  try {
    req.user = verifyTokenString(token);
  } catch {
    /* ignore */
  }
  next();
};
