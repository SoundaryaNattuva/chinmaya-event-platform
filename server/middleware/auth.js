const jwt = require('jsonwebtoken'); 
const { PrismaClient } = require('@prisma/client');

const prisma = require('../lib/prisma');

const authenticateToken = async (req, res, next) => {
  console.log('authenticateToken middleware hit');
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  console.log('Token received:', token ? 'Token exists' : 'No token');
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // 3. Verify token is real and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded); 
    
    // 4. Get fresh user info from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    console.log('User found:', user ? user.email : 'No user'); 

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // 5. Attach user info to request for next function
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  console.log('requireAdmin middleware hit, user role:', req.user?.role);
  
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