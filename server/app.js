import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticateToken, requireAdmin, requireStaff } from './middleware/auth.js';

// Import routes
import eventsRoute from './routes/events.js';
import ticketsRoute from './routes/tickets.js';
import authRoute from './routes/auth.js';
import purchasesRoute from './routes/purchases.js';
import adminRoute from './routes/admin.js';
import checkinRoute from './routes/checkin.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Public Routes
app.use('/api/events', eventsRoute);
app.use('/api/tickets', ticketsRoute);
app.use('/api/auth', authRoute);
app.use('/api/purchases', purchasesRoute);

// Protected Routes
app.use('/api/admin', authenticateToken, requireAdmin, adminRoute);
app.use('/api/checkin', authenticateToken, requireStaff, checkinRoute);

//Testing route

export default app;