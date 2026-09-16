"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'User name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'User email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    passwordHash: {
        type: String,
        required: [true, 'Password hash is required'],
        select: false,
    },
    role: {
        type: String,
        enum: {
            values: ['provider_admin', 'committee', 'guard'],
            message: '{VALUE} is not a valid user role',
        },
        required: [true, 'User role is required'],
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
        index: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Hash password before saving if modified
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) {
        return next();
    }
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.passwordHash = await bcryptjs_1.default.hash(this.passwordHash, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Helper method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.passwordHash);
};
exports.User = (0, mongoose_1.model)('User', userSchema);
