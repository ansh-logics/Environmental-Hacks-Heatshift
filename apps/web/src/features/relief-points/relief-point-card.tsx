import { RELIEF_POINT_TYPE_LABELS } from '@heatshift/shared';
import { Badge } from '../../components/ui/badge';
import { RELIEF_ICONS } from '../../components/ui/icons';
import { formatDistanceKm } from '../../lib/utils';
import type { NearbyReliefPoint } from './use-relief-points';

export function ReliefPointCard({
  point,
  showDistance = true,
}: {
  point: NearbyReliefPoint;
  showDistance?: boolean;
}) {
  const Icon = RELIEF_ICONS[point.type];

  return (
    <li className="flex gap-3 rounded-2xl border border-sand-300 bg-white p-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-heat-accent">
        <Icon size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold leading-snug">{point.name}</h3>
          {showDistance ? (
            <span className="shrink-0 text-sm font-bold tabular text-heat-accent-dark">
              {formatDistanceKm(point.distanceKm)}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-ink-500">
          {RELIEF_POINT_TYPE_LABELS[point.type]} - open {point.openingHours}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-ink-700">{point.address}</p>
        <div className="mt-2">
          {point.verified ? (
            <Badge tone="low">Field verified</Badge>
          ) : (
            <Badge tone="moderate">Needs verification</Badge>
          )}
        </div>
      </div>
    </li>
  );
}
