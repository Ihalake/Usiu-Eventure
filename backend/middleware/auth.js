// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // If no token, proceed without user authentication (for public endpoints)
    if (!token) {
      console.log('No token provided - proceeding as unauthenticated user');
      return next();
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log('User not found but token was valid');
        return next();
      }
      
      // Set user to request
      req.user = {
        id: user._id,
        role: user.role
      };
      
      next();
    } catch (tokenError) {
      console.log('Invalid token:', tokenError.message);
      // Proceed without authentication if token is invalid
      next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error in authentication' });
  }
};

module.exports = authMiddleware;