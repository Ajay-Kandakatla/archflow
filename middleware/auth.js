const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'archflow-dev-secret-change-in-prod';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'Ajaykandakatla@gmail.com').toLowerCase();

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.email.toLowerCase() !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    } catch { /* ignore invalid token */ }
  }
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
