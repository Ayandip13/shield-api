"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = getDashboard;
exports.getGuardDashboard = getGuardDashboard;
exports.getActivityStream = getActivityStream;
const dashboard_service_1 = require("../services/dashboard.service");
const apiResponse_1 = require("../utils/apiResponse");
const apiError_1 = require("../utils/apiError");
/**
 * Controller: GET /api/v1/dashboard
 * Role-aware dashboard handler for provider_admin and committee members
 */
async function getDashboard(req, res, next) {
    try {
        const user = req.user;
        if (!user) {
            throw apiError_1.ApiError.unauthorized('Authentication token required.', 'UNAUTHORIZED');
        }
        if (user.role === 'provider_admin') {
            const buildingIdFilter = typeof req.query.buildingId === 'string' ? req.query.buildingId : undefined;
            const data = await (0, dashboard_service_1.getProviderDashboardData)(user.providerId, buildingIdFilter);
            apiResponse_1.ApiResponse.success(res, 200, 'Provider dashboard retrieved successfully', data);
            return;
        }
        if (user.role === 'committee') {
            const data = await (0, dashboard_service_1.getCommitteeDashboardData)(user);
            apiResponse_1.ApiResponse.success(res, 200, 'Committee dashboard retrieved successfully', data);
            return;
        }
        if (user.role === 'guard') {
            throw apiError_1.ApiError.forbidden('Guards do not have access to system dashboards. Use /api/v1/dashboard/guard instead.', 'FORBIDDEN');
        }
        throw apiError_1.ApiError.badRequest('Invalid user role.', 'INVALID_ROLE');
    }
    catch (error) {
        next(error);
    }
}
/**
 * Controller: GET /api/v1/dashboard/guard
 * Duty status summary for guard operational terminal
 */
async function getGuardDashboard(req, res, next) {
    try {
        const user = req.user;
        if (!user) {
            throw apiError_1.ApiError.unauthorized('Authentication token required.', 'UNAUTHORIZED');
        }
        const data = await (0, dashboard_service_1.getGuardDashboardData)(user);
        apiResponse_1.ApiResponse.success(res, 200, 'Guard duty dashboard retrieved successfully', data);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Controller: GET /api/v1/dashboard/activity
 * Paginated/recent activity stream for provider and committee screens
 */
async function getActivityStream(req, res, next) {
    try {
        const user = req.user;
        if (!user) {
            throw apiError_1.ApiError.unauthorized('Authentication token required.', 'UNAUTHORIZED');
        }
        const buildingIdFilter = typeof req.query.buildingId === 'string' ? req.query.buildingId : undefined;
        const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 20;
        const data = await (0, dashboard_service_1.getSecurityActivityStream)(user, buildingIdFilter, isNaN(limit) ? 20 : limit);
        apiResponse_1.ApiResponse.success(res, 200, 'Security activity stream retrieved successfully', data);
    }
    catch (error) {
        next(error);
    }
}
