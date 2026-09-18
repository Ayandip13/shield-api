import rateLimit from 'express-rate-limit';
import { envConfig } from '../config/env.config';
import { ApiResponse } from '../utils/apiResponse';

export const loginRateLimiter = rateLimit({
  windowMs: envConfig.rateLimitWindowMs,
  max: envConfig.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(
      res,
      429,
      'Too many authentication attempts. Please try again in a few minutes.',
      'RATE_LIMIT_EXCEEDED'
    );
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: envConfig.rateLimitWindowMs,
  max: envConfig.apiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(
      res,
      429,
      'Too many requests. Please slow down.',
      'RATE_LIMIT_EXCEEDED'
    );
  },
});
