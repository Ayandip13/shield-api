"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attendance = void 0;
const mongoose_1 = require("mongoose");
const attendanceSchema = new mongoose_1.Schema({
    guardId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Guard ID is required'],
        index: true,
    },
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Provider',
        required: [true, 'Provider ID is required'],
        index: true,
    },
    buildingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Building',
        required: [true, 'Building ID is required'],
        index: true,
    },
    date: {
        type: String,
        required: [true, 'Attendance date string (YYYY-MM-DD) is required'],
        index: true,
    },
    checkIn: {
        type: Date,
        required: [true, 'Check-in time is required'],
    },
    checkOut: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        enum: ['present'],
        default: 'present',
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});
// Enforce single open attendance record per guard at database level
attendanceSchema.index({ guardId: 1 }, {
    unique: true,
    partialFilterExpression: { checkOut: null },
    name: 'unique_open_attendance_per_guard',
});
// Composite query indexes
attendanceSchema.index({ providerId: 1, date: 1 });
attendanceSchema.index({ buildingId: 1, date: 1 });
attendanceSchema.index({ guardId: 1, date: 1 });
attendanceSchema.index({ providerId: 1, checkOut: 1 });
attendanceSchema.index({ buildingId: 1, checkOut: 1 });
exports.Attendance = (0, mongoose_1.model)('Attendance', attendanceSchema);
