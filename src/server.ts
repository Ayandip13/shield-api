import mongoose from 'mongoose';
import { createApp } from './app';
import { envConfig } from './config/env.config';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';

async function startServer() {
  // Initialize Database Connection Foundation
  await connectDatabase();

  const app = createApp();

  const server = app.listen(envConfig.port, () => {
    logger.info(`Server running in [${envConfig.nodeEnv}] mode on port ${envConfig.port}`);
    logger.info(`Health check available at http://localhost:${envConfig.port}/api/v1/health`);
  });

  // Graceful Shutdown Handler
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal} signal, shutting down gracefully...`);
    server.close(async () => {
      logger.info('Closed out remaining HTTP connections.');
      try {
        await mongoose.connection.close();
        logger.info('Database connection closed cleanly.');
      } catch (err) {
        logger.error('Error closing database connection:', err);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
