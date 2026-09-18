"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = require("../../controllers/profile.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Require authentication for all profile routes
router.use(auth_middleware_1.authenticate);
router.get('/', profile_controller_1.getProfile);
router.patch('/', profile_controller_1.updateProfile);
router.patch('/password', profile_controller_1.changePassword);
exports.default = router;
