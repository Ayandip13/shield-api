"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const apiError_1 = require("../utils/apiError");
const apiResponse_1 = require("../utils/apiResponse");
const logger_1 = require("../utils/logger");
function errorMiddleware(err, _req, res, _next) {
    if (err instanceof apiError_1.ApiError) {
        logger_1.logger.warn(`Operational Error [${err.statusCode}]: ${err.message}`);
        apiResponse_1.ApiResponse.error(res, err.statusCode, err.message, err.code, err.details);
        return;
    }
    logger_1.logger.error(`Unhandled Error: ${err.message}`, err.stack);
    apiResponse_1.ApiResponse.error(res, 500, process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message, 'INTERNAL_SERVER_ERROR');
}
