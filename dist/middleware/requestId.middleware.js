"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
const crypto_1 = __importDefault(require("crypto"));
function requestIdMiddleware(req, res, next) {
    const existingId = req.headers['x-request-id'];
    const requestId = typeof existingId === 'string' ? existingId : crypto_1.default.randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
}
