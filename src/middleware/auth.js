const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/constants');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware - Token:', token ? 'Present' : 'Missing');

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token, access denied' 
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    console.log('Auth middleware - Decoded user ID:', decoded.id);
    
    const user = await User.findById(decoded.id);
    console.log('Auth middleware - User found:', user ? user.id : 'Not found');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account has been deactivated' 
      });
    }

    // Remove password from user object
    delete user.password;
    
    req.user = user;
    console.log('Auth middleware - Success, user role:', user.role);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ 
      success: false, 
      message: 'Token is invalid or expired' 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

module.exports = { auth, authorize, authenticate: auth };
