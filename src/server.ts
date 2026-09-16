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
  const shutdown = () => {
    logger.info('Received kill signal, shutting down gracefully...');
    server.close(() => {
      logger.info('Closed out remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
