"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const apiError_1 = require("../utils/apiError");
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(apiError_1.ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(apiError_1.ApiError.forbidden(`Access forbidden. Role '${req.user.role}' is not authorized to access this resource.`, 'FORBIDDEN_ROLE'));
        }
        next();
    };
}
