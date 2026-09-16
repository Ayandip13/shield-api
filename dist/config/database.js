"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.isDatabaseConnected = isDatabaseConnected;
const mongoose_1 = __importDefault(require("mongoose"));
const env_config_1 = require("./env.config");
async function connectDatabase() {
    try {
        mongoose_1.default.set('strictQuery', true);
        await mongoose_1.default.connect(env_config_1.envConfig.mongodbUri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('[Database] MongoDB connected successfully');
        return true;
    }
    catch (error) {
        const errMessage = error instanceof Error ? error.message : String(error);
        console.warn(`[Database] MongoDB connection error: ${errMessage}`);
        console.warn('[Database] Continuing server execution in disconnected mode.');
        return false;
    }
}
function isDatabaseConnected() {
    return mongoose_1.default.connection.readyState === 1;
}
