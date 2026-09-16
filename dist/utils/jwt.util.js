"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = require("../config/env.config");
function generateToken(payload) {
    const secret = env_config_1.envConfig.jwtSecret;
    const options = {
        expiresIn: env_config_1.envConfig.jwtExpiresIn,
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
}
function verifyToken(token) {
    const secret = env_config_1.envConfig.jwtSecret;
    return jsonwebtoken_1.default.verify(token, secret);
}
