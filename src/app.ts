import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { envConfig, validateEnv } from './config/env.config';
import v1Router from './routes/v1';
import { notFoundMiddleware } from './middleware/notFound.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { apiRateLimiter, loginRateLimiter } from './middleware/rateLimiter.middleware';

export function createApp(): Application {
  // Validate startup environment variables
  validateEnv();

  const app: Application = express();

  // Configure Trust Proxy
  if (envConfig.trustProxy) {
    app.set('trust proxy', 1);
  }

  // Security Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Sensible default for REST API JSON responses
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: envConfig.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    })
  );

  // Request Body Size Limits (Strict 100kb limit)
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Unique Request ID Middleware
  app.use(requestIdMiddleware);

  if (envConfig.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Login & Refresh Brute Force Rate Limiter on Auth Endpoints
  app.use('/api/v1/auth/login', loginRateLimiter);
  app.use('/api/v1/auth/refresh', loginRateLimiter);

  // General API Rate Limiter
  app.use('/api/v1', apiRateLimiter);

  // API v1 Routes
  app.use('/api/v1', v1Router);

  // 404 Handler
  app.use(notFoundMiddleware);

  // Centralized Error Handler
  app.use(errorMiddleware);

  return app;
}
