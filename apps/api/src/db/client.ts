import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env';
import * as schema from './schema';

/**
 * One connection pool per process. `max` is small on purpose: one Fargate task
 * should never be the reason RDS runs out of connections.
 */
export const sql = postgres(env.DATABASE_URL, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(sql, { schema, logger: false });

export type Database = typeof db;

/** Cheap liveness probe used by GET /health. */
export async function pingDatabase(): Promise<'up' | 'down'> {
  try {
    await sql`select 1`;
    return 'up';
  } catch {
    return 'down';
  }
}

export async function closeDatabase(): Promise<void> {
  await sql.end({ timeout: 5 });
}
