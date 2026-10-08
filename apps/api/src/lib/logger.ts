import { env } from '../config/env';

/**
 * Fastify ships pino; we only configure it here so HTTP logs and script logs
 * share one level and shape. JSON output is what CloudWatch/ECS expects.
 */
export const loggerOptions = {
  level: env.LOG_LEVEL,
  base: { service: 'heatshift-api', env: env.NODE_ENV },
} as const;

type Line = (message: string, meta?: unknown) => void;

/** Minimal logger for migrate/seed scripts that run outside the HTTP server. */
export function createScriptLogger(
  prefix: string,
): Record<'info' | 'warn' | 'error', Line> {
  const emit =
    (level: 'info' | 'warn' | 'error'): Line =>
    (message, meta) => {
      const suffix = meta === undefined ? '' : ` ${JSON.stringify(meta)}`;
      const line = `[${prefix}] ${message}${suffix}`;
      if (level === 'error') console.error(line);
      else if (level === 'warn') console.warn(line);
      else console.info(line);
    };

  return { info: emit('info'), warn: emit('warn'), error: emit('error') };
}
