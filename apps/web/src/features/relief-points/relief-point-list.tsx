import type { ReliefPoint } from '@heatshift/shared';
import { EmptyState } from '../../components/shared/empty-state';
import { Skeleton } from '../../components/ui/skeleton';
import { withDistances } from './use-relief-points';
import { ReliefPointCard } from './relief-point-card';
import type { Coordinates } from '../../hooks/use-location';
import type { NearbyReliefPoint } from './use-relief-points';

export function ReliefPointList({
  points,
  origin,
  loading = false,
  emptyMessage = 'No relief points match this filter yet.',
  limit,
  selectedId,
  onSelect,
}: {
  points: ReliefPoint[];
  origin: Coordinates;
  loading?: boolean;
  emptyMessage?: string;
  limit?: number;
  selectedId?: string | null;
  onSelect?: (point: NearbyReliefPoint) => void;
}) {
  if (loading) {
    return (
      <ul className="space-y-3" aria-busy="true">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </ul>
    );
  }

  const nearby = withDistances(points, origin).slice(0, limit ?? points.length);
  if (nearby.length === 0) return <EmptyState title={emptyMessage} />;

  return (
    <ul className="space-y-3">
      {nearby.map((point) => (
        <ReliefPointCard
          key={point.id}
          point={point}
          selected={point.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}
