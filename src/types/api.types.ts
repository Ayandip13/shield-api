export interface ApiResponseFormat<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface HealthCheckData {
  status: string;
  uptime: number;
  environment: string;
  database: {
    connected: boolean;
    state: string;
  };
  timestamp: string;
}
