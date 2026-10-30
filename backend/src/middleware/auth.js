const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header. Expected Bearer <token>',
        details: null,
      },
      request_id: req.headers['x-request-id'] || Math.random().toString(36).substring(7),
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'avaaj_super_secret_jwt_key_2026_team21');
    const user = await User.findById(decoded.id || decoded._id);
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'User belonging to this token no longer exists.',
          details: null,
        },
        request_id: Math.random().toString(36).substring(7),
      });
    }

    req.user = user;
    next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      error: {
        code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        message: isExpired ? 'Token has expired. Please log in again.' : 'Invalid token.',
        details: null,
      },
      request_id: Math.random().toString(36).substring(7),
    });
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'avaaj_super_secret_jwt_key_2026_team21');
    const user = await User.findById(decoded.id || decoded._id);
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Continue unauthenticated if token invalid
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Only admin can perform this operation.',
        details: null,
      },
      request_id: Math.random().toString(36).substring(7),
    });
  }
  next();
};

const requireCampusMaintenance = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const role = req.user.role;
  const dept = (req.user.dept || '').toLowerCase();

  const isCM = (role === 'office_staff' && dept.includes('campus maintenance')) || role === 'admin';

  if (!isCM) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Only Campus Maintenance office staff or admin can perform this action.',
        details: null,
      },
      request_id: Math.random().toString(36).substring(7),
    });
  }
  next();
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireAdmin,
  requireCampusMaintenance,
};
