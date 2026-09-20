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
const requestId_middleware_1 = require("./middleware/requestId.middleware");
const rateLimiter_middleware_1 = require("./middleware/rateLimiter.middleware");
function createApp() {
    // Validate startup environment variables
    (0, env_config_1.validateEnv)();
    const app = (0, express_1.default)();
    // Configure Trust Proxy
    if (env_config_1.envConfig.trustProxy) {
        app.set('trust proxy', 1);
    }
    // Security Headers (Helmet)
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false, // Sensible default for REST API JSON responses
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    // CORS Configuration
    app.use((0, cors_1.default)({
        origin: env_config_1.envConfig.corsOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }));
    // Request Body Size Limits (Strict 100kb limit)
    app.use(express_1.default.json({ limit: '100kb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '100kb' }));
    // Unique Request ID Middleware
    app.use(requestId_middleware_1.requestIdMiddleware);
    if (env_config_1.envConfig.nodeEnv !== 'test') {
        app.use((0, morgan_1.default)('dev'));
    }
    // Login & Refresh Brute Force Rate Limiter on Auth Endpoints
    app.use('/api/v1/auth/login', rateLimiter_middleware_1.loginRateLimiter);
    app.use('/api/v1/auth/refresh', rateLimiter_middleware_1.loginRateLimiter);
    // General API Rate Limiter
    app.use('/api/v1', rateLimiter_middleware_1.apiRateLimiter);
    // API v1 Routes
    app.use('/api/v1', v1_1.default);
    // 404 Handler
    app.use(notFound_middleware_1.notFoundMiddleware);
    // Centralized Error Handler
    app.use(error_middleware_1.errorMiddleware);
    return app;
}
