import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const workerRoleEnum = pgEnum('worker_role', ['worker', 'coordinator']);

export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  role: workerRoleEnum('role').notNull().default('worker'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
