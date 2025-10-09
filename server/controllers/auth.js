import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    if (!user.is_active) {
      return res.status(400).json({ error: 'Account is disabled' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        assigned_events: user.assigned_events
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    const { password_hash: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        assigned_events: true,
        created_at: true,
        is_active: true
      }
    });
    
    if (!user || !user.is_active) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }
    
    res.json(user);
    
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};