"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntryLog = void 0;
const mongoose_1 = require("mongoose");
const entryLogSchema = new mongoose_1.Schema({
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
    guardId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Guard ID is required'],
        index: true,
    },
    personName: {
        type: String,
        required: [true, 'Person name is required'],
        trim: true,
        maxlength: [100, 'Person name cannot exceed 100 characters'],
    },
    phone: {
        type: String,
        trim: true,
        maxlength: [30, 'Phone number cannot exceed 30 characters'],
    },
    personType: {
        type: String,
        enum: {
            values: ['visitor', 'delivery', 'staff', 'other'],
            message: '{VALUE} is not a valid person type',
        },
        required: [true, 'Person type is required'],
        index: true,
    },
    purpose: {
        type: String,
        trim: true,
        maxlength: [200, 'Purpose cannot exceed 200 characters'],
    },
    flatUnit: {
        type: String,
        trim: true,
        maxlength: [50, 'Flat/Unit cannot exceed 50 characters'],
    },
    entryTime: {
        type: Date,
        required: [true, 'Entry time is required'],
        default: Date.now,
        index: true,
    },
    exitTime: {
        type: Date,
        default: null,
        index: true,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
}, {
    timestamps: true,
});
// Compound indexes for performant active visitor & historical queries
entryLogSchema.index({ buildingId: 1, exitTime: 1 });
entryLogSchema.index({ providerId: 1, exitTime: 1 });
entryLogSchema.index({ buildingId: 1, entryTime: -1 });
entryLogSchema.index({ providerId: 1, entryTime: -1 });
exports.EntryLog = (0, mongoose_1.model)('EntryLog', entryLogSchema);
