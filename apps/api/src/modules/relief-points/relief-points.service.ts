import { and, desc, eq, sql } from 'drizzle-orm';
import type { ListReliefPointsQuery, ReliefPoint } from '@heatshift/shared';
import { db } from '../../db/client';
import { reliefPoints } from '../../db/schema';

export const RELIEF_POINTS_SOURCE =
  'Delhi demo seed (2026-05) — positions are approximate';

function toReliefPoint(row: typeof reliefPoints.$inferSelect): ReliefPoint {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    verified: row.verified,
    openingHours: row.openingHours,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listReliefPoints(
  query: ListReliefPointsQuery,
): Promise<{ data: ReliefPoint[]; count: number; meta: { demo: true; source: string } }> {
  const filters = [];
  if (query.type) filters.push(eq(reliefPoints.type, query.type));
  if (query.verifiedOnly) filters.push(eq(reliefPoints.verified, true));

  const where = filters.length > 0 ? and(...filters) : undefined;
  const rows = await db
    .select()
    .from(reliefPoints)
    .where(where)
    .orderBy(desc(reliefPoints.verified), sql`${reliefPoints.name} asc`)
    .limit(query.limit);

  return {
    data: rows.map(toReliefPoint),
    count: rows.length,
    meta: { demo: true, source: RELIEF_POINTS_SOURCE },
  };
}
