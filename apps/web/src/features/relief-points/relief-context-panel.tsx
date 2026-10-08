import { RELIEF_POINT_TYPE_LABELS } from '@heatshift/shared';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { IconInfo, IconPin } from '../../components/ui/icons';
import { formatDistanceKm } from '../../lib/utils';
import type { Coordinates } from '../../hooks/use-location';
import type { NearbyReliefPoint } from './use-relief-points';

/**
 * Right-hand context pane on desktop. The plot is a schematic of the straight
 * line between you and the selected point - deliberately not a map tile layer,
 * and labelled as such.
 */
export function ReliefContextPanel({
  point,
  origin,
  locationLabel,
  locationSource,
}: {
  point: NearbyReliefPoint | null;
  origin: Coordinates;
  locationLabel: string;
  locationSource: 'demo' | 'device';
}) {
  return (
    <Card
      eyebrow="Context"
      title={point ? 'Selected location' : 'Nothing selected yet'}
      variant="quiet"
    >
      <PositionPlot point={point} origin={origin} />

      <p className="mt-3 flex items-start gap-1.5 text-[0.7rem] leading-snug text-ink-500">
        <IconInfo size={14} className="mt-px shrink-0" />
        Schematic of relative position only. A real map layer is not part of this build.
      </p>

      {point ? (
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="eyebrow">Place</dt>
            <dd className="mt-0.5 font-bold text-ink-900">{point.name}</dd>
          </div>
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
            <dt className="text-ink-500">Distance</dt>
            <dd className="font-semibold tabular text-heat-accent-dark">
              {formatDistanceKm(point.distanceKm)}
            </dd>
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
        <p className="mt-4 text-sm text-ink-500">
          Choose a point from the list to see its hours, distance and verification status
          here.
        </p>
      )}

      <p className="mt-4 border-t border-sand-200 pt-3 text-xs text-ink-500">
        Measured from <span className="font-semibold text-ink-700">{locationLabel}</span>
        {locationSource === 'demo'
          ? ' - share your position to make distances exact.'
          : ''}
      </p>
    </Card>
  );
}

/** You in the middle, the selected point where its coordinates put it. */
function PositionPlot({
  point,
  origin,
}: {
  point: NearbyReliefPoint | null;
  origin: Coordinates;
}) {
  const dLat = point ? point.latitude - origin.lat : 0;
  const dLng = point ? point.longitude - origin.lng : 0;
  const span = Math.max(Math.abs(dLat), Math.abs(dLng), 0.0001);
  const reach = 34;
  const x = point ? 50 + (dLng / span) * reach : 50;
  const y = point ? 50 - (dLat / span) * reach : 50;

  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-xl border border-sand-200 bg-white"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(28,18,13,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,18,13,0.05) 1px, transparent 1px)',
        backgroundSize: '12.5% 12.5%',
      }}
      role="img"
      aria-label={
        point
          ? `Schematic: ${point.name} sits ${formatDistanceKm(point.distanceKm)} from the reference point.`
          : 'Empty position schematic with the reference point at the centre.'
      }
    >
      <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-heat-accent ring-4 ring-heat-accent/15" />
      <span className="absolute left-1/2 top-[calc(50%+10px)] -translate-x-1/2 text-[0.65rem] font-bold uppercase tracking-wide text-ink-400">
        You
      </span>

      {point ? (
        <>
          <span
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-heat-accent-dark"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
          <span
            className="absolute -translate-x-1/2 -translate-y-9 whitespace-nowrap text-[0.65rem] font-semibold text-ink-700"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {point.name.split('—')[0]?.trim() ?? point.name}
          </span>
        </>
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-ink-400">
          <IconPin size={28} />
        </span>
      )}
    </div>
  );
}
