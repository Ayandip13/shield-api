import { Schema, model, Document } from 'mongoose';

export interface IProvider extends Document {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const providerSchema = new Schema<IProvider>(
  {
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
  },
  {
    timestamps: true,
  }
);

export const Provider = model<IProvider>('Provider', providerSchema);
