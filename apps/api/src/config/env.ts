import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  /** Single browser origin allowed to call the API (no wildcard in production). */
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\/.+/, 'DATABASE_URL must be a postgres connection string')
    .default('postgres://heatshift:heatshift@localhost:5432/heatshift'),
  /** Container boot helpers (see apps/api/Dockerfile entrypoint). */
  MIGRATE_ON_BOOT: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  SEED_ON_BOOT: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

export type Env = z.output<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  // Fail fast and loudly: a misconfigured container should not half-boot.
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const env: Env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const apiVersion = 'v1';
