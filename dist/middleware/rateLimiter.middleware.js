"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRateLimiter = exports.loginRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_config_1 = require("../config/env.config");
const apiResponse_1 = require("../utils/apiResponse");
exports.loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_config_1.envConfig.rateLimitWindowMs,
    max: env_config_1.envConfig.loginRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        apiResponse_1.ApiResponse.error(res, 429, 'Too many authentication attempts. Please try again in a few minutes.', 'RATE_LIMIT_EXCEEDED');
    },
});
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_config_1.envConfig.rateLimitWindowMs,
    max: env_config_1.envConfig.apiRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        apiResponse_1.ApiResponse.error(res, 429, 'Too many requests. Please slow down.', 'RATE_LIMIT_EXCEEDED');
    },
});
