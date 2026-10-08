import { RELIEF_POINT_TYPE_LABELS } from '@heatshift/shared';
import { Badge } from '../../components/ui/badge';
import { RELIEF_ICONS } from '../../components/ui/icons';
import { formatDistanceKm } from '../../lib/utils';
import { cn } from '../../lib/utils';
import type { NearbyReliefPoint } from './use-relief-points';

/**
 * The whole card is the tap target - on a phone with gloves on, a small "select"
 * link is not a control.
 */
export function ReliefPointCard({
  point,
  selected = false,
  onSelect,
}: {
  point: NearbyReliefPoint;
  selected?: boolean;
  onSelect?: (point: NearbyReliefPoint) => void;
}) {
  const Icon = RELIEF_ICONS[point.type];

  const body = (
    <>
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-heat-accent">
        <Icon size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-bold leading-snug text-ink-900">
            {point.name}
          </span>
          <span className="shrink-0 text-sm font-bold tabular text-heat-accent-dark">
            {formatDistanceKm(point.distanceKm)}
          </span>
        </span>
        <span className="mt-0.5 block text-xs text-ink-500">
          {RELIEF_POINT_TYPE_LABELS[point.type]} - open {point.openingHours}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-ink-700">
          {point.address}
        </span>
        <span className="mt-2 block">
          {point.verified ? (
            <Badge tone="low">Field verified</Badge>
          ) : (
            <Badge tone="moderate">Needs verification</Badge>
          )}
        </span>
      </span>
    </>
  );

  return (
    <li>
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(point)}
          aria-pressed={selected}
          className={cn(
            'flex w-full gap-3 rounded-2xl border bg-white p-3 text-left transition-colors',
            selected
              ? 'border-heat-accent shadow-card'
              : 'border-sand-200 hover:border-sand-400',
          )}
        >
          {body}
        </button>
      ) : (
        <div className="flex gap-3 rounded-2xl border border-sand-200 bg-white p-3">
          {body}
        </div>
      )}
    </li>
  );
}
