"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = void 0;
const mongoose_1 = require("mongoose");
const providerSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Provider name is required'],
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
exports.Provider = (0, mongoose_1.model)('Provider', providerSchema);
