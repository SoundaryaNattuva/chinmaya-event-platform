import express from 'express';
import { login, getCurrentUser } from '../controllers/auth.js';

const router = express.Router();

// POST /api/auth/login - User login
router.post('/login', login);

// GET /api/auth/me - Get current user info
router.get('/me', getCurrentUser);

export default router;