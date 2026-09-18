"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_routes_1 = __importDefault(require("./health.routes"));
const auth_routes_1 = __importDefault(require("../auth.routes"));
const building_routes_1 = __importDefault(require("./building.routes"));
const guard_routes_1 = __importDefault(require("./guard.routes"));
const committee_routes_1 = __importDefault(require("./committee.routes"));
const attendance_routes_1 = __importDefault(require("./attendance.routes"));
const entryLog_routes_1 = __importDefault(require("./entryLog.routes"));
const dashboard_routes_1 = __importDefault(require("./dashboard.routes"));
const v1Router = (0, express_1.Router)();
// Mount Endpoints
v1Router.use('/health', health_routes_1.default);
v1Router.use('/auth', auth_routes_1.default);
v1Router.use('/buildings', building_routes_1.default);
v1Router.use('/guards', guard_routes_1.default);
v1Router.use('/committee-members', committee_routes_1.default);
v1Router.use('/committee', committee_routes_1.default);
v1Router.use('/attendance', attendance_routes_1.default);
v1Router.use('/entry-logs', entryLog_routes_1.default);
v1Router.use('/dashboard', dashboard_routes_1.default);
exports.default = v1Router;
