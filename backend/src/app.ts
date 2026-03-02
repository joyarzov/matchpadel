import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { corsConfig } from './config/cors';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import clubsRoutes from './modules/clubs/clubs.routes';
import matchesRoutes from './modules/matches/matches.routes';
import availabilityRoutes from './modules/availability/availability.routes';
import { shareMatch } from './modules/matches/matchShare.controller';

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors(corsConfig));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiter
app.use(generalLimiter);

// Share route (serves HTML with OG tags for WhatsApp previews — must be before API routes)
app.get('/share/match/:matchId', shareMatch);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/availability', availabilityRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

// Global error handler
app.use(errorHandler);

export default app;
