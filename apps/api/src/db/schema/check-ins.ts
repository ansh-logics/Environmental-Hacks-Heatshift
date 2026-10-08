import { pgEnum, pgTable, real, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const checkInStatusEnum = pgEnum('check_in_status', [
  'okay',
  'need_water',
  'need_break',
  'unwell',
]);

/** A worker taps one of four statuses; coordinators read the aggregate. */
export const checkIns = pgTable('check_ins', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: checkInStatusEnum('status').notNull(),
  /** Optional: a check-in is still useful when the phone cannot get a fix. */
  latitude: real('latitude'),
  longitude: real('longitude'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
