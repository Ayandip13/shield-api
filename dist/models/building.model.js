"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Building = void 0;
const mongoose_1 = require("mongoose");
const buildingSchema = new mongoose_1.Schema({
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Provider',
        required: [true, 'Provider ID is required'],
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Building name is required'],
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    contactPhone: {
        type: String,
        trim: true,
    },
    contactEmail: {
        type: String,
        trim: true,
        lowercase: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
exports.Building = (0, mongoose_1.model)('Building', buildingSchema);
