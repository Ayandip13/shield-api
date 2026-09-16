import { Schema, model, Document, Types } from 'mongoose';

export interface IBuilding extends Document {
  providerId: Types.ObjectId;
  name: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const buildingSchema = new Schema<IBuilding>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'Provider',
      required: [true, 'Provider ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Building name is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
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

export const Building = model<IBuilding>('Building', buildingSchema);
