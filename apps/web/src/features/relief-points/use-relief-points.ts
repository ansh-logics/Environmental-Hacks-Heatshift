import { useMemo } from 'react';
import type { ReliefPoint, ReliefPointType } from '@heatshift/shared';
import { api } from '../../lib/api-client';
import { useAsync } from '../../hooks/use-async';
import { haversineKm } from '../../lib/utils';
import type { Coordinates } from '../../hooks/use-location';

export type NearbyReliefPoint = ReliefPoint & { distanceKm: number };

export function useReliefPoints(
  filters: { type?: ReliefPointType; verifiedOnly?: boolean; limit?: number } = {},
) {
  const query = useAsync(
    () => api.listReliefPoints(filters),
    [filters.type, filters.verifiedOnly, filters.limit],
  );

  const points = useMemo<ReliefPoint[]>(() => query.data?.data ?? [], [query.data]);

  return { ...query, points, source: query.data?.meta.source ?? '' };
}

export function withDistances(
  points: ReliefPoint[],
  origin: Coordinates,
): NearbyReliefPoint[] {
  return points
    .map((point) => ({
      ...point,
      distanceKm: haversineKm(origin, { lat: point.latitude, lng: point.longitude }),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
