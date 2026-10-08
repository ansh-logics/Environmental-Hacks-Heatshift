import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit reads DATABASE_URL from the environment; a local default keeps
 * `pnpm db:generate` usable without a running database.
 */
export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgres://heatshift:heatshift@localhost:5432/heatshift',
  },
  strict: true,
  verbose: false,
});
