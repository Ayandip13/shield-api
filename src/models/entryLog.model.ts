import { Schema, model, Document, Types } from 'mongoose';

export type PersonType = 'visitor' | 'delivery' | 'staff' | 'other';

export interface IEntryLog extends Document {
  providerId: Types.ObjectId;
  buildingId: Types.ObjectId;
  guardId: Types.ObjectId;
  personName: string;
  phone?: string;
  personType: PersonType;
  purpose?: string;
  flatUnit?: string;
  entryTime: Date;
  exitTime?: Date | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const entryLogSchema = new Schema<IEntryLog>(
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
      required: [true, 'Building ID is required'],
      index: true,
    },
    guardId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant active visitor & historical queries
entryLogSchema.index({ buildingId: 1, exitTime: 1 });
entryLogSchema.index({ providerId: 1, exitTime: 1 });
entryLogSchema.index({ buildingId: 1, entryTime: -1 });
entryLogSchema.index({ providerId: 1, entryTime: -1 });

export const EntryLog = model<IEntryLog>('EntryLog', entryLogSchema);
