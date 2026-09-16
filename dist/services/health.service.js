"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_config_1 = require("../config/env.config");
class HealthService {
    static getHealthData() {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
        };
        const dbStateCode = mongoose_1.default.connection.readyState;
        const isConnected = dbStateCode === 1;
        return {
            status: 'healthy',
            uptime: process.uptime(),
            environment: env_config_1.envConfig.nodeEnv,
            database: {
                connected: isConnected,
                state: states[dbStateCode] || 'unknown',
            },
            timestamp: new Date().toISOString(),
        };
    }
}
exports.HealthService = HealthService;
