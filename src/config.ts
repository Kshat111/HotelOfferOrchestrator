import 'dotenv/config';

interface Environment {
  REDIS_URL: string;
  TEMPORAL_ADDRESS: string;
  SUPPLIER_A_URL: string;
  SUPPLIER_B_URL: string;
  PORT: number;
  CORS_ALLOWED_ORIGINS: string[];
  SIMULATE_SUPPLIER_DOWN: 'none' | 'a' | 'b';
}

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function portFromEnvironment(): number {
  const value = process.env.PORT?.trim() || '3000';
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535; received: ${value}`);
  }

  return port;
}

function allowedOriginsFromEnvironment(): string[] {
  const value = process.env.CORS_ALLOWED_ORIGINS?.trim() || 'http://localhost:3000';
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0 || origins.includes('*')) {
    throw new Error('CORS_ALLOWED_ORIGINS must contain explicit origins and cannot be "*"');
  }

  return origins;
}

function simulatedSupplierFromEnvironment(): 'none' | 'a' | 'b' {
  const value = process.env.SIMULATE_SUPPLIER_DOWN?.trim().toLowerCase() || 'none';

  if (value !== 'none' && value !== 'a' && value !== 'b') {
    throw new Error('SIMULATE_SUPPLIER_DOWN must be one of: none, a, b');
  }

  return value;
}

export const config: Environment = {
  REDIS_URL: requiredEnvironmentVariable('REDIS_URL'),
  TEMPORAL_ADDRESS: requiredEnvironmentVariable('TEMPORAL_ADDRESS'),
  SUPPLIER_A_URL: requiredEnvironmentVariable('SUPPLIER_A_URL'),
  SUPPLIER_B_URL: requiredEnvironmentVariable('SUPPLIER_B_URL'),
  PORT: portFromEnvironment(),
  CORS_ALLOWED_ORIGINS: allowedOriginsFromEnvironment(),
  // Integration testing and Postman demos only; do not use in production.
  SIMULATE_SUPPLIER_DOWN: simulatedSupplierFromEnvironment(),
};
