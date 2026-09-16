"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_config_1 = require("./config/env.config");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
async function startServer() {
    // Initialize Database Connection Foundation
    await (0, database_1.connectDatabase)();
    const app = (0, app_1.createApp)();
    const server = app.listen(env_config_1.envConfig.port, () => {
        logger_1.logger.info(`Server running in [${env_config_1.envConfig.nodeEnv}] mode on port ${env_config_1.envConfig.port}`);
        logger_1.logger.info(`Health check available at http://localhost:${env_config_1.envConfig.port}/api/v1/health`);
    });
    // Graceful Shutdown Handler
    const shutdown = () => {
        logger_1.logger.info('Received kill signal, shutting down gracefully...');
        server.close(() => {
            logger_1.logger.info('Closed out remaining connections.');
            process.exit(0);
        });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
startServer().catch((err) => {
    logger_1.logger.error('Failed to start server:', err);
    process.exit(1);
});
