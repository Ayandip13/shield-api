import mongoose from 'mongoose';
import { envConfig } from './env.config';

export async function connectDatabase(): Promise<boolean> {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(envConfig.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[Database] MongoDB connected successfully');
    return true;
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[Database] MongoDB connection error: ${errMessage}`);
    console.warn('[Database] Continuing server execution in disconnected mode.');
    return false;
  }
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
