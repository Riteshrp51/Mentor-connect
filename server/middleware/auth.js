import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - Verify JWT
export const protect = async (req, res, next) => {
  let token;

  // Check header for authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token and attach to request
    req.user = await User.findById(decoded.userId);
    
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User no longer exists',
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route',
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `User role '${req.user ? req.user.role : 'unknown'}' is not authorized to access this route`,
      });
    }
    next();
  };
};
