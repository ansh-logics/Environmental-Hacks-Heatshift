import {
  boolean,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const reliefPointTypeEnum = pgEnum('relief_point_type', [
  'water',
  'shade',
  'clinic',
  'cooling_space',
  'canteen',
]);

/** Places a worker can go to for water, shade, medical help or cooling. */
export const reliefPoints = pgTable('relief_points', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  type: reliefPointTypeEnum('type').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  address: text('address').notNull(),
  /** false for every seeded demo point until someone actually walks there. */
  verified: boolean('verified').notNull().default(false),
  openingHours: text('opening_hours').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
