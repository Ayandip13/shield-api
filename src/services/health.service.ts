import mongoose from 'mongoose';
import { envConfig } from '../config/env.config';
import { HealthCheckData } from '../types/api.types';

export class HealthService {
  public static getHealthData(): HealthCheckData {
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const dbStateCode = mongoose.connection.readyState;
    const isConnected = dbStateCode === 1;

    return {
      status: isConnected ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      environment: envConfig.nodeEnv,
      database: {
        connected: isConnected,
        state: states[dbStateCode] || 'unknown',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
