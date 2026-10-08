import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { closeDatabase, db } from './client';
import { createScriptLogger } from '../lib/logger';

const log = createScriptLogger('migrate');
/**
 * Drizzle SQL lives in apps/api/drizzle, outside dist/. Both the tsx dev run and
 * the container start with apps/api as the working directory, so cwd is stable
 * even though tsup bundles this file into dist/server.js.
 */
export const migrationsFolder = resolve(process.cwd(), 'drizzle');

export async function runMigrations(): Promise<void> {
  if (!existsSync(migrationsFolder)) {
    throw new Error(`No migrations directory at ${migrationsFolder}; run from apps/api`);
  }
  log.info('applying migrations', { folder: migrationsFolder });
  await migrate(db, { migrationsFolder });
  log.info('migrations up to date');
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  runMigrations()
    .then(() => closeDatabase())
    .catch((error: unknown) => {
      log.error(
        'migration failed',
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    });
}
