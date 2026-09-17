"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shift = void 0;
const mongoose_1 = require("mongoose");
const shiftSchema = new mongoose_1.Schema({
    guardId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Guard ID is required'],
        unique: true,
        index: true,
    },
    buildingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Building',
        required: [true, 'Building ID is required'],
        index: true,
    },
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Provider',
        required: [true, 'Provider ID is required'],
        index: true,
    },
    startTime: {
        type: String,
        required: [true, 'Shift start time is required'],
        default: '08:00',
        trim: true,
    },
    endTime: {
        type: String,
        required: [true, 'Shift end time is required'],
        default: '20:00',
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
exports.Shift = (0, mongoose_1.model)('Shift', shiftSchema);
