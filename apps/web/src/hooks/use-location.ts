import { useCallback, useEffect, useRef, useState } from 'react';
import { DEMO_LOCATION } from '../lib/constants';

export type Coordinates = { lat: number; lng: number };

/** Where the worker stands with the browser prompt, from their point of view. */
export type LocationStatus = 'idle' | 'locating' | 'available' | 'unavailable';

/** Why the device position is missing, so the UI can say something specific. */
export type LocationFailure = 'denied' | 'unavailable' | 'timeout' | 'unsupported';

export type LocationState = {
  coords: Coordinates;
  label: string;
  source: 'demo' | 'device';
  status: LocationStatus;
  failure: LocationFailure | null;
  error: string | null;
  useDeviceLocation: () => void;
};

const FAILURE_MESSAGES: Record<LocationFailure, string> = {
  denied:
    'Location was blocked. Your city and shift answers still work; distances use the demo centre.',
  unavailable:
    'Your device could not give a position just now. Distances still use the demo centre.',
  timeout:
    'Deciding on a location took too long. Try again, or keep using the demo centre.',
  unsupported:
    'This browser cannot share a location. Distances still use the demo centre.',
};

/** GeolocationError.code is a stable part of the spec. */
const FAILURE_BY_CODE: Record<number, LocationFailure> = {
  1: 'denied',
  2: 'unavailable',
  3: 'timeout',
};

/**
 * Browser location, requested only when the worker presses the button - never
 * on page load. The precise position lives in this hook's state and nowhere
 * else: no storage write, and it only leaves the device in a check-in the
 * worker sends or a weather lookup they asked for.
 *
 * Until a device position exists, distances are measured from the demo centre,
 * so manual city and profile answers keep working untouched.
 */
export function useLocation(): LocationState {
  const [coords, setCoords] = useState<Coordinates>(DEMO_LOCATION);
  const [label, setLabel] = useState<string>(DEMO_LOCATION.label);
  const [source, setSource] = useState<'demo' | 'device'>('demo');
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [failure, setFailure] = useState<LocationFailure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const useDeviceLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setFailure('unsupported');
      setError(FAILURE_MESSAGES.unsupported);
      setStatus('unavailable');
      return;
    }

    setStatus('locating');
    setFailure(null);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!alive.current) return;
        setSource('device');
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLabel('Your current position');
        setFailure(null);
        setError(null);
        setStatus('available');
      },
      (cause) => {
        if (!alive.current) return;
        const reason = FAILURE_BY_CODE[cause.code] ?? 'unavailable';
        // Fall back to the demo centre rather than leaving distances undefined.
        setSource('demo');
        setCoords(DEMO_LOCATION);
        setLabel(DEMO_LOCATION.label);
        setFailure(reason);
        setError(FAILURE_MESSAGES[reason]);
        setStatus('unavailable');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  return { coords, label, source, status, failure, error, useDeviceLocation };
}
