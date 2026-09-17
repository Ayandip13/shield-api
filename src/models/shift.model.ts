import { Schema, model, Document, Types } from 'mongoose';

export interface IShift extends Document {
  guardId: Types.ObjectId;
  buildingId: Types.ObjectId;
  providerId: Types.ObjectId;
  startTime: string; // HH:mm format, e.g. "08:00"
  endTime: string;   // HH:mm format, e.g. "20:00"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shiftSchema = new Schema<IShift>(
  {
    guardId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Guard ID is required'],
      unique: true,
      index: true,
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: 'Building',
      required: [true, 'Building ID is required'],
      index: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

export const Shift = model<IShift>('Shift', shiftSchema);
