import { useEffect, useState } from 'react';
import type { HeatRiskLiveRequest, HeatRiskLiveResult } from '@heatshift/shared';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { IconPin, IconRefresh } from '../../components/ui/icons';
import { ErrorNote } from '../../components/shared/error-note';
import { relativeTime } from '../../lib/utils';
import type { LocationState } from '../../hooks/use-location';
import type { WorkerProfileDraft } from '../onboarding/profile';

/**
 * The one place the app asks for a live position. It is a button, never a page
 * load: the worker decides when their coordinates leave the device, and the
 * manual weather panel keeps working whether they press it or not.
 */
export function LiveHeatRiskCard({
  location,
  profile,
  result,
  error,
  loading,
  onRun,
}: {
  location: LocationState;
  profile: WorkerProfileDraft;
  result: HeatRiskLiveResult | null;
  error: string | null;
  loading: boolean;
  onRun: (input: HeatRiskLiveRequest) => void;
}) {
  // A granted position arrives after the browser callback, so the request waits
  // on this flag rather than firing the moment the page renders.
  const [awaiting, setAwaiting] = useState(false);
  const live = () =>
    onRun({
      latitude: location.coords.lat,
      longitude: location.coords.lng,
      sunExposure: profile.sunExposure,
      hoursInShift: profile.hoursInShift,
      workType: profile.workType,
      waterAccess: profile.waterAccess,
      shadeAccess: profile.shadeAccess,
      acclimatized: profile.acclimatized,
    });

  useEffect(() => {
    if (!awaiting) return;
    if (location.status === 'available') {
      setAwaiting(false);
      live();
    } else if (location.status === 'unavailable') {
      setAwaiting(false);
    }
  }, [awaiting, location]);

  const havePosition = location.status === 'available';
  const start = () => {
    if (havePosition) {
      live();
      return;
    }
    setAwaiting(true);
    location.useDeviceLocation();
  };

  return (
    <Card
      eyebrow="Live weather"
      title="Heat risk where you are standing"
      action={
        <span className="flex items-center gap-2 text-xs font-semibold">
          <StatusPip status={location.status} />
          <span className="text-ink-700">{STATUS_TEXT[location.status]}</span>
        </span>
      }
    >
      <p className="text-sm leading-snug text-ink-700">
        {havePosition
          ? 'Your position is in memory for this session only. Refresh pulls the current weather again and recalculates the plan.'
          : 'HeatShift asks your browser for a position, fetches the weather for that spot, and rebuilds the plan. The coordinates are used for the request and are not stored.'}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant={havePosition ? 'secondary' : 'primary'}
          onClick={start}
          loading={loading || location.status === 'locating'}
        >
          {havePosition ? <IconRefresh size={18} /> : <IconPin size={18} />}
          {havePosition ? 'Refresh live plan' : 'Use my location for live heat risk'}
        </Button>
        {result ? (
          <span className="text-xs text-ink-500">
            Last live plan {relativeTime(result.weather.observedAt)}
          </span>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        {location.error && !loading ? <ErrorNote message={location.error} /> : null}
        {error ? <ErrorNote message={error} /> : null}
      </div>
    </Card>
  );
}

const STATUS_TEXT: Record<LocationState['status'], string> = {
  idle: 'No position shared',
  locating: 'Asking your browser',
  available: 'Using your position',
  unavailable: 'Using demo weather',
};

const PIP_CLASS: Record<LocationState['status'], string> = {
  idle: 'bg-sand-400',
  locating: 'bg-heat-moderate',
  available: 'bg-heat-low',
  // A blocked prompt is a normal state, not an incident - amber, not red.
  unavailable: 'bg-heat-moderate',
};

function StatusPip({ status }: { status: LocationState['status'] }) {
  return (
    <span
      aria-hidden="true"
      className={`h-2.5 w-2.5 shrink-0 rounded-full ${PIP_CLASS[status]}`}
    />
  );
}

/**
 * Replaces the demo disclaimer once a plan came from live weather: the numbers
 * are real, so say where they came from and how old they are.
 */
export function LiveProvenance({ result }: { result: HeatRiskLiveResult }) {
  const { weather } = result;
  return (
    <div className="mt-3 rounded-xl border border-sand-200 bg-sand-50 px-3 py-2 text-xs leading-snug text-ink-700">
      <p className="font-semibold text-ink-900">{result.source}</p>
      <p className="mt-1 tabular">
        Observed {formatObservationTime(weather.observedAt)} (
        {relativeTime(weather.observedAt)}){' - '}
        {weather.temperatureC.toFixed(1)} °C, {Math.round(weather.humidityPercent)}%
        humidity, wind {Math.round(weather.windSpeedKmh)} km/h, cloud{' '}
        {weather.cloudCoverPercent === null
          ? 'unknown'
          : `${Math.round(weather.cloudCoverPercent)}%`}
      </p>
      <p className="mt-1 text-ink-500">
        Provider {weather.provider}
        {weather.freshness.cached ? ' from cache' : ''}, refreshed{' '}
        {relativeTime(weather.freshness.fetchedAt)}. Model: {result.model}. Relief points
        nearby are still demo data.
      </p>
    </div>
  );
}

function formatObservationTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
