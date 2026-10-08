import { and, desc, eq, sql } from 'drizzle-orm';
import {
  haversineKm,
  type ListReliefPointsQuery,
  type ReliefPoint,
} from '@heatshift/shared';
import { db } from '../../db/client';
import { reliefPoints } from '../../db/schema';

export const RELIEF_POINTS_SOURCE =
  'Delhi demo seed (2026-05) — positions are approximate';

/**
 * Distance ranking happens in the process, not in SQL, so the whole product
 * shares one Haversine. That means reading the filtered set before slicing to
 * `limit`, which is bounded here: past a few hundred points per city this
 * should move to a PostGIS index rather than raising the ceiling.
 */
const DISTANCE_SCAN_LIMIT = 500;

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
  const origin =
    query.latitude !== undefined && query.longitude !== undefined
      ? { latitude: query.latitude, longitude: query.longitude }
      : null;

  const rows = await db
    .select()
    .from(reliefPoints)
    .where(where)
    .orderBy(desc(reliefPoints.verified), sql`${reliefPoints.name} asc`)
    .limit(origin ? DISTANCE_SCAN_LIMIT : query.limit);

  const data = rows.map(toReliefPoint);

  if (!origin) {
    return {
      data,
      count: data.length,
      meta: { demo: true, source: RELIEF_POINTS_SOURCE },
    };
  }

  const ranked = data
    .map((point) => ({
      ...point,
      distanceKm: Number(
        haversineKm(origin, {
          latitude: point.latitude,
          longitude: point.longitude,
        }).toFixed(3),
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, query.limit);

  return {
    data: ranked,
    count: ranked.length,
    meta: { demo: true, source: RELIEF_POINTS_SOURCE },
  };
}
