const jwt = require('jsonwebtoken'); 
const { PrismaClient } = require('@prisma/client');

const prisma = require('../lib/prisma');

const authenticateToken = async (req, res, next) => {
  // 1. Look for JWT token in request headers
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  // 2. If no token → block access
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // 3. Verify token is real and not expired
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // 4. Get fresh user info from database
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  // 5. Attach user info to request for next function
  req.user = user;
  next(); // "Security cleared, proceed to next checkpoint"
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to check if user is admin or volunteer
const requireStaff = (req, res, next) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'VOLUNTEER') {
    return res.status(403).json({ error: 'Staff access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireStaff
};