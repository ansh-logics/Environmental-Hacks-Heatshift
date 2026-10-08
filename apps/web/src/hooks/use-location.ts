import { useCallback, useState } from 'react';
import { DEMO_LOCATION } from '../lib/constants';

export type Coordinates = { lat: number; lng: number };

export type LocationState = {
  coords: Coordinates;
  label: string;
  source: 'demo' | 'device';
  requesting: boolean;
  error: string | null;
  useDeviceLocation: () => void;
};

/**
 * Distances work out of the box from a demo centre; the worker can upgrade to
 * their real position with one tap. No map is drawn in this phase.
 */
export function useLocation(): LocationState {
  const [state, setState] = useState<{
    coords: Coordinates;
    label: string;
    source: 'demo' | 'device';
    requesting: boolean;
    error: string | null;
  }>({
    coords: { lat: DEMO_LOCATION.lat, lng: DEMO_LOCATION.lng },
    label: DEMO_LOCATION.label,
    source: 'demo',
    requesting: false,
    error: null,
  });

  const useDeviceLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState((current) => ({
        ...current,
        error: 'This browser cannot share a location.',
      }));
      return;
    }

    setState((current) => ({ ...current, requesting: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setState({
          coords: { lat: position.coords.latitude, lng: position.coords.longitude },
          label: 'Your current position',
          source: 'device',
          requesting: false,
          error: null,
        }),
      () =>
        setState((current) => ({
          ...current,
          requesting: false,
          error: 'Location blocked. Distances still use the demo centre.',
        })),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }, []);

  return { ...state, useDeviceLocation };
}
