import { randomUUID } from 'node:crypto';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import type { CheckIn, CheckInStatus, CreateCheckInInput } from '@heatshift/shared';
import { db } from '../../db/client';
import { checkIns } from '../../db/schema';

const DEMO_META = {
  demo: true,
  source: 'Demo data from the seeded mock worker',
} as const;

function toCheckIn(row: typeof checkIns.$inferSelect): CheckIn {
  return {
    id: row.id,
    userId: row.userId,
    status: row.status,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createCheckIn(input: CreateCheckInInput): Promise<CheckIn> {
  const values = {
    id: randomUUID(),
    userId: input.userId,
    status: input.status,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
  };

  const [row] = await db.insert(checkIns).values(values).returning();
  if (!row) throw Object.assign(new Error('Insert failed'), { statusCode: 500 });
  return toCheckIn(row);
}

export async function summarizeCheckIns(query: { userId?: string; windowHours: number }) {
  const windowStart = new Date(Date.now() - query.windowHours * 3600 * 1000);
  const scope = query.userId ? [eq(checkIns.userId, query.userId)] : [];

  const [totalsRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
      uniqueWorkers: sql<number>`count(distinct ${checkIns.userId})::int`,
    })
    .from(checkIns)
    .where(scope.length ? and(...scope) : undefined);

  const statusRows = await db
    .select({
      status: checkIns.status,
      count: sql<number>`count(*)::int`,
    })
    .from(checkIns)
    .where(scope.length ? and(...scope) : undefined)
    .groupBy(checkIns.status);

  const byStatus: Record<CheckInStatus, number> = {
    okay: 0,
    need_water: 0,
    need_break: 0,
    unwell: 0,
  };
  for (const row of statusRows) byStatus[row.status] = row.count;

  const [inWindowRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(checkIns)
    .where(and(...scope, gte(checkIns.createdAt, windowStart)));

  const latestRows = await db
    .select()
    .from(checkIns)
    .where(scope.length ? and(...scope) : undefined)
    .orderBy(desc(checkIns.createdAt))
    .limit(10);

  return {
    total: totalsRow?.total ?? 0,
    windowHours: query.windowHours,
    inWindow: inWindowRow?.count ?? 0,
    uniqueWorkers: totalsRow?.uniqueWorkers ?? 0,
    byStatus,
    latest: latestRows.map(toCheckIn),
    generatedAt: new Date().toISOString(),
    meta: DEMO_META,
  };
}
