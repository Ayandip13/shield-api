"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(res, statusCode = 200, message = 'Success', data) {
        const responseBody = {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
        };
        return res.status(statusCode).json(responseBody);
    }
    static error(res, statusCode = 500, message = 'An unexpected error occurred', code = 'INTERNAL_ERROR', details) {
        const responseBody = {
            success: false,
            message,
            error: {
                code,
                details,
            },
            timestamp: new Date().toISOString(),
        };
        return res.status(statusCode).json(responseBody);
    }
}
exports.ApiResponse = ApiResponse;
