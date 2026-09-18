"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
function sanitize(item) {
    if (item === null || item === undefined)
        return item;
    if (typeof item === 'string') {
        if (item.toLowerCase().includes('bearer ') || item.toLowerCase().includes('jwt ')) {
            return '[REDACTED_TOKEN]';
        }
        return item;
    }
    if (typeof item === 'object') {
        if (Array.isArray(item)) {
            return item.map(sanitize);
        }
        const sanitizedObj = {};
        for (const [key, value] of Object.entries(item)) {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('password') ||
                lowerKey.includes('secret') ||
                lowerKey.includes('token') ||
                lowerKey === 'authorization' ||
                lowerKey === 'auth') {
                sanitizedObj[key] = '[REDACTED]';
            }
            else {
                sanitizedObj[key] = sanitize(value);
            }
        }
        return sanitizedObj;
    }
    return item;
}
exports.logger = {
    info: (message, ...meta) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...meta.map(sanitize));
    },
    warn: (message, ...meta) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...meta.map(sanitize));
    },
    error: (message, ...meta) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...meta.map(sanitize));
    },
    debug: (message, ...meta) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...meta.map(sanitize));
        }
    },
};
