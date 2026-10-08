import { pgEnum, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const workTypeEnum = pgEnum('work_type', [
  'delivery_rider',
  'security_guard',
  'construction',
  'street_vendor',
  'sanitation',
  'other',
]);

export const accessLevelEnum = pgEnum('access_level', ['none', 'limited', 'reliable']);

/** One row per worker. No authentication yet: identity is the mock user id. */
export const workerProfiles = pgTable('worker_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  workType: workTypeEnum('work_type').notNull(),
  city: varchar('city', { length: 120 }).notNull(),
  /** "HH:mm" in the worker's local time; stored as text until scheduling matters. */
  defaultShiftStart: text('default_shift_start').notNull().default('09:00'),
  defaultShiftEnd: text('default_shift_end').notNull().default('18:00'),
  waterAccess: accessLevelEnum('water_access').notNull().default('limited'),
  shadeAccess: accessLevelEnum('shade_access').notNull().default('limited'),
});
