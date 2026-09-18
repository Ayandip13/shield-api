"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const apiError_1 = require("../utils/apiError");
const apiResponse_1 = require("../utils/apiResponse");
const logger_1 = require("../utils/logger");
function errorMiddleware(err, _req, res, _next) {
    // Operational ApiError
    if (err instanceof apiError_1.ApiError) {
        logger_1.logger.warn(`Operational Error [${err.statusCode}]: ${err.message}`);
        apiResponse_1.ApiResponse.error(res, err.statusCode, err.message, err.code, err.details);
        return;
    }
    // Handle Express body-parser SyntaxError (invalid JSON body)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        logger_1.logger.warn(`JSON Parse Error: ${err.message}`);
        apiResponse_1.ApiResponse.error(res, 400, 'Malformed JSON payload in request body.', 'MALFORMED_JSON');
        return;
    }
    // Handle Mongoose CastError (invalid ObjectId or type casting error)
    if (err.name === 'CastError') {
        logger_1.logger.warn(`Mongoose CastError: Invalid value for field ${err.path}`);
        apiResponse_1.ApiResponse.error(res, 400, `Invalid format for field '${err.path}'.`, 'INVALID_FORMAT');
        return;
    }
    // Handle Mongoose ValidationError
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors || {}).map((e) => e.message);
        logger_1.logger.warn(`Mongoose ValidationError: ${messages.join(', ')}`);
        apiResponse_1.ApiResponse.error(res, 400, messages[0] || 'Validation error', 'VALIDATION_ERROR', messages);
        return;
    }
    // Handle Mongoose duplicate key error (code 11000)
    if (err.code === 11000) {
        const keys = err.keyValue ? Object.keys(err.keyValue).join(', ') : 'field';
        logger_1.logger.warn(`Mongoose DuplicateKey Error: ${keys}`);
        apiResponse_1.ApiResponse.error(res, 409, `A record with this ${keys} already exists.`, 'DUPLICATE_RESOURCE');
        return;
    }
    // Unhandled / Internal Server Error
    logger_1.logger.error(`Unhandled Server Error: ${err.message}`, err.stack);
    apiResponse_1.ApiResponse.error(res, 500, process.env.NODE_ENV === 'production' ? 'An internal server error occurred.' : err.message, 'INTERNAL_SERVER_ERROR');
}
