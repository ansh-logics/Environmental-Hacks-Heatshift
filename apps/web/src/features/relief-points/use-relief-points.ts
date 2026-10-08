import { useMemo } from 'react';
import { haversineKm, type ReliefPoint, type ReliefPointType } from '@heatshift/shared';
import { api } from '../../lib/api-client';
import { useAsync } from '../../hooks/use-async';
import type { Coordinates } from '../../hooks/use-location';

export type NearbyReliefPoint = ReliefPoint & { distanceKm: number };

export function useReliefPoints(
  filters: {
    type?: ReliefPointType;
    verifiedOnly?: boolean;
    limit?: number;
    /** Sent as a pair so the API can rank nearest-first before it applies limit. */
    origin?: Coordinates;
  } = {},
) {
  const { origin, ...rest } = filters;
  const query = useAsync(
    () =>
      api.listReliefPoints({
        ...rest,
        latitude: origin?.lat,
        longitude: origin?.lng,
      }),
    [rest.type, rest.verifiedOnly, rest.limit, origin?.lat, origin?.lng],
  );

  const points = useMemo<ReliefPoint[]>(() => query.data?.data ?? [], [query.data]);

  return { ...query, points, source: query.data?.meta.source ?? '' };
}

/**
 * Distances for display, always measured from the origin currently on screen
 * (which may be mid-refetch) with the same shared Haversine the API ranks by.
 */
export function withDistances(
  points: ReliefPoint[],
  origin: Coordinates,
): NearbyReliefPoint[] {
  return points
    .map((point) => ({
      ...point,
      distanceKm: haversineKm(
        { latitude: origin.lat, longitude: origin.lng },
        { latitude: point.latitude, longitude: point.longitude },
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
