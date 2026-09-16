"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundMiddleware = notFoundMiddleware;
const apiError_1 = require("../utils/apiError");
function notFoundMiddleware(req, _res, next) {
    next(apiError_1.ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
