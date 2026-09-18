function sanitize(item: unknown): unknown {
  if (item === null || item === undefined) return item;
  if (typeof item === 'string') {
    if (item.toLowerCase().includes('bearer ') || item.toLowerCase().includes('jwt ')) {
      return '[REDACTED_TOKEN]';
    }
    return item;
  }
  if (typeof item === 'object') {
    if (Array.isArray(item)) {
      return item.map(sanitize);
    }
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey === 'authorization' ||
        lowerKey === 'auth'
      ) {
        sanitizedObj[key] = '[REDACTED]';
      } else {
        sanitizedObj[key] = sanitize(value);
      }
    }
    return sanitizedObj;
  }
  return item;
}

export const logger = {
  info: (message: string, ...meta: unknown[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...meta.map(sanitize));
  },
  warn: (message: string, ...meta: unknown[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...meta.map(sanitize));
  },
  error: (message: string, ...meta: unknown[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...meta.map(sanitize));
  },
  debug: (message: string, ...meta: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...meta.map(sanitize));
    }
  },
};

