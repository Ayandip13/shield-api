"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Provider',
        required: [true, 'Provider ID is required'],
        index: true,
    },
    buildingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Building',
        default: null,
        index: true,
    },
    recipientUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    type: {
        type: String,
        enum: {
            values: ['attendance', 'entry_exit', 'guard', 'building', 'system'],
            message: '{VALUE} is not a valid notification type',
        },
        required: [true, 'Notification type is required'],
        index: true,
    },
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true,
        maxlength: [150, 'Notification title cannot exceed 150 characters'],
    },
    message: {
        type: String,
        required: [true, 'Notification message is required'],
        trim: true,
        maxlength: [500, 'Notification message cannot exceed 500 characters'],
    },
    relatedEntityType: {
        type: String,
        trim: true,
        default: null,
    },
    relatedEntityId: {
        type: mongoose_1.Schema.Types.ObjectId,
        default: null,
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true,
    },
}, {
    timestamps: true,
});
// Compound indexes for performant query execution
notificationSchema.index({ recipientUserId: 1, createdAt: -1 });
notificationSchema.index({ buildingId: 1, createdAt: -1 });
notificationSchema.index({ providerId: 1, createdAt: -1 });
exports.Notification = (0, mongoose_1.model)('Notification', notificationSchema);
