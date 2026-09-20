"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("./app");
const env_config_1 = require("./config/env.config");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
async function startServer() {
    // Initialize Database Connection Foundation
    const isConnected = await (0, database_1.connectDatabase)();
    if (!isConnected && env_config_1.envConfig.isProduction) {
        logger_1.logger.error('[Fatal] Database connection failed during production startup. Exiting process.');
        process.exit(1);
    }
    const app = (0, app_1.createApp)();
    const server = app.listen(env_config_1.envConfig.port, () => {
        logger_1.logger.info(`Server running in [${env_config_1.envConfig.nodeEnv}] mode on port ${env_config_1.envConfig.port}`);
        logger_1.logger.info(`Health check available at http://localhost:${env_config_1.envConfig.port}/api/v1/health`);
    });
    // Graceful Shutdown Handler
    const shutdown = (signal) => {
        logger_1.logger.info(`Received ${signal} signal, shutting down gracefully...`);
        server.close(async () => {
            logger_1.logger.info('Closed out remaining HTTP connections.');
            try {
                await mongoose_1.default.connection.close();
                logger_1.logger.info('Database connection closed cleanly.');
            }
            catch (err) {
                logger_1.logger.error('Error closing database connection:', err);
            }
            process.exit(0);
        });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
startServer().catch((err) => {
    logger_1.logger.error('Failed to start server:', err);
    process.exit(1);
});
