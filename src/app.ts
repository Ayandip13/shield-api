import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { envConfig } from './config/env.config';
import v1Router from './routes/v1';
import { notFoundMiddleware } from './middleware/notFound.middleware';
import { errorMiddleware } from './middleware/error.middleware';

export function createApp(): Application {
  const app: Application = express();

  // Basic Security & Parsing Middleware
  app.use(helmet());
  app.use(cors({ origin: envConfig.corsOrigin }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (envConfig.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // API v1 Routes
  app.use('/api/v1', v1Router);

  // 404 Handler
  app.use(notFoundMiddleware);

  // Centralized Error Handler
  app.use(errorMiddleware);

  return app;
}
