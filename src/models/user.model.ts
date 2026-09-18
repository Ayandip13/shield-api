import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'provider_admin' | 'committee' | 'guard';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  providerId: Types.ObjectId;
  buildingId?: Types.ObjectId;
  employeeId?: string;
  joiningDate?: Date;
  monthlySalary?: number;
  designation?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
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
      type: Schema.Types.ObjectId,
      ref: 'Provider',
      required: [true, 'Provider ID is required'],
      index: true,
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: 'Building',
      index: true,
    },
    employeeId: {
      type: String,
      trim: true,
    },
    joiningDate: {
      type: Date,
    },
    monthlySalary: {
      type: Number,
      min: [0, 'Monthly salary cannot be negative'],
    },
    designation: {
      type: String,
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

userSchema.index({ providerId: 1, role: 1, isActive: 1 });
userSchema.index({ buildingId: 1, role: 1, isActive: 1 });

// Hash password before saving if modified
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Helper method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = model<IUser>('User', userSchema);
