import { Suspense, lazy, useCallback, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { HAS_MAPBOX_TOKEN } from '../../lib/constants';
import { RELIEF_MARKER_COLOURS, USER_MARKER_COLOUR } from './relief-marker';
import type { NearbyReliefPoint } from './use-relief-points';
import type { Coordinates } from '../../hooks/use-location';

/**
 * Mapbox is a large dependency, so it sits behind React.lazy and this wrapper is
 * what the route imports. Without a token the lazy chunk is never even
 * requested: the fallback renders straight away and the map bundle stays out of
 * the page.
 */
const ReliefMap = lazy(() => import('./relief-map'));

export type ReliefMapSectionProps = {
  points: NearbyReliefPoint[];
  selectedId: string | null;
  origin: Coordinates;
  hasDeviceLocation: boolean;
  onSelect: (point: NearbyReliefPoint) => void;
};

export function ReliefMapSection({
  points,
  selectedId,
  origin,
  hasDeviceLocation,
  onSelect,
}: ReliefMapSectionProps) {
  const [failure, setFailure] = useState<string | null>(null);
  const onError = useCallback((message: string) => setFailure(message), []);
  const usable = HAS_MAPBOX_TOKEN && failure === null;

  return (
    <Card
      eyebrow="Map"
      title="Relief map"
      variant="quiet"
      action={
        <span className="text-xs font-semibold text-ink-500">
          {usable ? `${points.length} plotted` : 'List view'}
        </span>
      }
    >
      <div className="h-[240px] overflow-hidden rounded-xl border border-sand-200 bg-white sm:h-[300px] lg:min-h-[320px] lg:h-[46vh] xl:h-[52vh]">
        {usable ? (
          <Suspense fallback={<Skeleton className="h-full w-full rounded-xl" />}>
            <ReliefMap
              points={points}
              selectedId={selectedId}
              origin={origin}
              hasDeviceLocation={hasDeviceLocation}
              onSelect={onSelect}
              onError={onError}
            />
          </Suspense>
        ) : (
          <MapUnavailable missingToken={!HAS_MAPBOX_TOKEN} />
        )}
      </div>

      <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-700">
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 rounded-full border-2 border-white shadow-[0_0_0_1px_#c92a2a]"
            style={{ background: RELIEF_MARKER_COLOURS.clinic }}
          />
          Filled means field verified
        </li>
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 rounded-full border-2 bg-white"
            style={{ borderColor: RELIEF_MARKER_COLOURS.clinic }}
          />
          Hollow means needs verification
        </li>
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 rounded-full border-2 border-white"
            style={{ background: USER_MARKER_COLOUR }}
          />
          Your position
        </li>
        <li className="text-ink-500">Marker colour is the point type.</li>
      </ul>
    </Card>
  );
}

/**
 * Short and deliberate: the Mapbox error can carry request detail, and a public
 * token is never repeated back on screen.
 */
function MapUnavailable({ missingToken }: { missingToken: boolean }) {
  return (
    <div className="flex h-full flex-col justify-center gap-2 bg-sand-50 px-5 text-center">
      <p className="text-sm font-bold text-ink-900">
        Map unavailable in this environment
      </p>
      <p className="mx-auto max-w-[44ch] text-xs leading-snug text-ink-500">
        {missingToken
          ? 'Set VITE_MAPBOX_ACCESS_TOKEN in the repository root .env and rebuild the web image to draw the base map.'
          : 'The configured Mapbox token did not load a base map. Check the token and the network, then reload.'}
      </p>
      <p className="mx-auto max-w-[44ch] text-xs leading-snug text-ink-700">
        Nothing else changes. The list beside this panel is the same data, ordered by the
        same distances, and selecting a point still opens its details.
      </p>
    </div>
  );
}
