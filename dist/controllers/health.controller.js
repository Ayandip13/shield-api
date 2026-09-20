"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const health_service_1 = require("../services/health.service");
const apiResponse_1 = require("../utils/apiResponse");
class HealthController {
    static checkHealth(_req, res, next) {
        try {
            const healthData = health_service_1.HealthService.getHealthData();
            const isConnected = healthData.database.connected;
            const statusCode = isConnected ? 200 : 503;
            const message = isConnected
                ? 'Security Management Backend API operational'
                : 'Security Management Backend API degraded - Database disconnected';
            apiResponse_1.ApiResponse.success(res, statusCode, message, healthData);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.HealthController = HealthController;
