"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_config_1 = require("./config/env.config");
const v1_1 = __importDefault(require("./routes/v1"));
const notFound_middleware_1 = require("./middleware/notFound.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
function createApp() {
    const app = (0, express_1.default)();
    // Basic Security & Parsing Middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({ origin: env_config_1.envConfig.corsOrigin }));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    if (env_config_1.envConfig.nodeEnv !== 'test') {
        app.use((0, morgan_1.default)('dev'));
    }
    // API v1 Routes
    app.use('/api/v1', v1_1.default);
    // 404 Handler
    app.use(notFound_middleware_1.notFoundMiddleware);
    // Centralized Error Handler
    app.use(error_middleware_1.errorMiddleware);
    return app;
}
