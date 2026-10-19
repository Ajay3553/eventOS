// const express = require('express');
import express, { json } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {errorHandler} from './middleware/error.middleware.js';

const app = express();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

// Security Headers
app.use(helmet());

// CORS configuration
// const allowedOrigins = [
//   process.env.CLIENT_URL,
//   'http://localhost:5173',
//   'http://localhost:3000',
//   // 'https://univento.vercel.app'
// ].filter(Boolean);
const allowedOrigins = process.env.CLIENT_URL || 'http://localhost:5173' || 'http://localhost:3000';

app.use(cors(
  {
    origin: allowedOrigins,
    credentials: true
  }
));

// Body Parsers
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
// Import Routes
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import eventRoutes from './routes/event.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import settingsRoutes from './routes/settings.routes.js';

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoints
const healthCheck = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'eventos-backend',
    message: 'EventOS Centralized Backend API is running healthy',
    timestamp: new Date().toISOString()
  });
};

app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// Global Error Handler
app.use(errorHandler);

export {app};
