import { RELIEF_POINT_TYPE_LABELS } from '@heatshift/shared';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { formatDistanceKm } from '../../lib/utils';
import type { NearbyReliefPoint } from './use-relief-points';

/**
 * The detail panel for whatever is selected on the map or in the list. It is the
 * accessible half of the pair: everything a marker says with colour or position,
 * it says in text.
 */
export function ReliefContextPanel({
  point,
  locationLabel,
  locationSource,
}: {
  point: NearbyReliefPoint | null;
  locationLabel: string;
  locationSource: 'demo' | 'device';
}) {
  return (
    <Card
      eyebrow="Selected point"
      title={point ? point.name : 'Nothing selected yet'}
      variant="quiet"
      action={
        point ? (
          <span className="shrink-0 text-sm font-bold tabular text-heat-accent-dark">
            {formatDistanceKm(point.distanceKm)}
          </span>
        ) : null
      }
    >
      {point ? (
        <dl className="space-y-2 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-ink-500">Type</dt>
            <dd className="font-semibold text-ink-900">
              {RELIEF_POINT_TYPE_LABELS[point.type]}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-ink-500">Open</dt>
            <dd className="font-semibold tabular text-ink-900">{point.openingHours}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-ink-500">Coordinates</dt>
            <dd className="font-semibold tabular text-ink-900">
              {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Address</dt>
            <dd className="mt-0.5 text-ink-700">{point.address}</dd>
          </div>
          <div className="pt-1">
            <dd>
              {point.verified ? (
                <Badge tone="low">Field verified</Badge>
              ) : (
                <Badge tone="moderate">Needs verification</Badge>
              )}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-ink-500">
          Choose a point on the map or in the list to see its address, hours, distance and
          verification status here.
        </p>
      )}

      <p className="mt-4 border-t border-sand-200 pt-3 text-xs text-ink-500">
        Measured from <span className="font-semibold text-ink-700">{locationLabel}</span>
        {locationSource === 'demo' ? ' - use your location to make distances exact.' : ''}
      </p>
    </Card>
  );
}
