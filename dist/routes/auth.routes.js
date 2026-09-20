"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public auth routes
router.post('/login', auth_controller_1.login);
router.post('/refresh', auth_controller_1.refresh);
router.post('/logout', auth_controller_1.logout);
// Protected auth routes
router.post('/logout-all', auth_middleware_1.authenticate, auth_controller_1.logoutAll);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.getMe);
exports.default = router;
