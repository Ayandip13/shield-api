import { Schema, model, Document, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;
  revokedAt?: Date | null;
  replacedByTokenHash?: string | null;
  createdByIp?: string;
  userAgent?: string;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for refresh token'],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true,
      index: true,
    },
    familyId: {
      type: String,
      required: [true, 'Family ID is required'],
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: { expires: 0 }, // MongoDB TTL index auto-deletes expired records
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
    replacedByTokenHash: {
      type: String,
      default: null,
    },
    createdByIp: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

refreshTokenSchema.index({ userId: 1, revokedAt: 1 });
refreshTokenSchema.index({ familyId: 1, revokedAt: 1 });

export const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
