import { UserRole } from '../models/user.model';
import { Types } from 'mongoose';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  providerId: Types.ObjectId | string;
  buildingId?: Types.ObjectId | string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
