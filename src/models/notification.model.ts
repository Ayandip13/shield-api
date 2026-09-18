import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType = 'attendance' | 'entry_exit' | 'guard' | 'building' | 'system';

export interface INotification extends Document {
  providerId: Types.ObjectId;
  buildingId?: Types.ObjectId | null;
  recipientUserId?: Types.ObjectId | null;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string | null;
  relatedEntityId?: Types.ObjectId | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'Provider',
      required: [true, 'Provider ID is required'],
      index: true,
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: 'Building',
      default: null,
      index: true,
    },
    recipientUserId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant query execution
notificationSchema.index({ recipientUserId: 1, createdAt: -1 });
notificationSchema.index({ buildingId: 1, createdAt: -1 });
notificationSchema.index({ providerId: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
