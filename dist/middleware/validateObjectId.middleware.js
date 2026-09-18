"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateObjectId = validateObjectId;
const mongoose_1 = require("mongoose");
const apiError_1 = require("../utils/apiError");
function validateObjectId(...paramNames) {
    return (req, _res, next) => {
        for (const paramName of paramNames) {
            const paramValue = req.params[paramName];
            if (paramValue && (typeof paramValue !== 'string' || !mongoose_1.Types.ObjectId.isValid(paramValue))) {
                return next(apiError_1.ApiError.badRequest(`Invalid format for parameter '${paramName}'. Expected valid 24-character hex ObjectId.`, 'INVALID_OBJECT_ID'));
            }
        }
        next();
    };
}
