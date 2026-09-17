import { Schema, model, Document, Types } from 'mongoose';

export type AttendanceStatus = 'present';

export interface IAttendance extends Document {
  guardId: Types.ObjectId;
  providerId: Types.ObjectId;
  buildingId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  checkIn: Date;
  checkOut?: Date | null;
  status: AttendanceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    guardId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Guard ID is required'],
      index: true,
    },
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
  },
  {
    timestamps: true,
  }
);

// Enforce single open attendance record per guard at database level
attendanceSchema.index(
  { guardId: 1 },
  {
    unique: true,
    partialFilterExpression: { checkOut: null },
    name: 'unique_open_attendance_per_guard',
  }
);

// Composite query indexes
attendanceSchema.index({ providerId: 1, date: 1 });
attendanceSchema.index({ buildingId: 1, date: 1 });
attendanceSchema.index({ guardId: 1, date: 1 });

export const Attendance = model<IAttendance>('Attendance', attendanceSchema);
