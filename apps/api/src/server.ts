import { env } from './config/env';
import { closeDatabase } from './db/client';
import { runMigrations } from './db/migrate';
import { runSeed } from './db/seed';
import { buildApp } from './app';
import { createScriptLogger } from './lib/logger';

const log = createScriptLogger('boot');

async function prepareDatabase(): Promise<void> {
  if (env.MIGRATE_ON_BOOT) {
    try {
      await runMigrations();
    } catch (error) {
      log.warn(
        'skipping migrations - database not reachable',
        error instanceof Error ? error.message : String(error),
      );
      return;
    }
  }
  if (env.SEED_ON_BOOT) {
    try {
      await runSeed();
    } catch (error) {
      log.warn(
        'skipping demo seed',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}

async function main(): Promise<void> {
  await prepareDatabase();

  const app = await buildApp();

  await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info(`HeatShift API listening on http://${env.HOST}:${env.PORT}`);

  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received, closing connections`);
    await app.close();
    await closeDatabase();
    process.exit(0);
  };

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => void shutdown(signal));
  }
}

main().catch((error: unknown) => {
  log.error(
    'API failed to start',
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exit(1);
});
