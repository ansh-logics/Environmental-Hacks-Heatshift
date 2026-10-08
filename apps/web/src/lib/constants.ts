import {
  CHECK_IN_STATUSES,
  MOCK_WORKER_ID,
  MOCK_WORKER_NAME,
  ROUTES,
  type CheckInStatus,
} from '@heatshift/shared';

export { MOCK_WORKER_ID, MOCK_WORKER_NAME, ROUTES };

/** No auth yet: every request uses this placeholder worker identity. */
export const DEMO_IDENTITY_NOTE =
  'Demo identity only - HeatShift has no login yet, so all requests use one mock worker.';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '');
export const API_TIMEOUT_MS = 8000;
/** Poll interval for the API connectivity indicator. */
export const HEALTH_POLL_MS = 20000;

/** `label` fits the mobile bottom bar; `longLabel` is the desktop sidebar text. */
export const NAV_ITEMS = [
  { to: ROUTES.dashboard, label: 'My shift', longLabel: 'My shift', icon: 'gauge' },
  { to: ROUTES.relief, label: 'Relief', longLabel: 'Relief points', icon: 'pin' },
  { to: ROUTES.coordinator, label: 'Team', longLabel: 'Team', icon: 'people' },
] as const;

/** Used until the browser grants a real location. */
export const DEMO_LOCATION = {
  lat: 28.6315,
  lng: 77.2167,
  label: 'Connaught Place, New Delhi (demo centre)',
} as const;

export const HEAT_RISK_PRESETS = {
  delhiNoon: {
    label: 'Delhi, 2 pm in May',
    temperatureC: 44,
    humidityPercent: 24,
    windSpeedKmh: 10,
    sunExposure: 'full_sun' as const,
  },
  delhiMorning: {
    label: 'Delhi, 8 am in May',
    temperatureC: 33,
    humidityPercent: 45,
    windSpeedKmh: 8,
    sunExposure: 'full_sun' as const,
  },
  coastalAfternoon: {
    label: 'Mumbai harbour, 3 pm',
    temperatureC: 34,
    humidityPercent: 78,
    windSpeedKmh: 14,
    sunExposure: 'partial_shade' as const,
  },
} as const;

export const CHECK_IN_BUTTONS: Array<{
  status: CheckInStatus;
  icon: 'drop' | 'shade' | 'check' | 'alert';
  tone: 'neutral' | 'moderate' | 'high' | 'severe';
}> = CHECK_IN_STATUSES.map((status) => ({
  status,
  icon:
    status === 'okay'
      ? 'check'
      : status === 'need_water'
        ? 'drop'
        : status === 'need_break'
          ? 'shade'
          : 'alert',
  tone:
    status === 'okay'
      ? 'neutral'
      : status === 'need_water'
        ? 'moderate'
        : status === 'need_break'
          ? 'high'
          : 'severe',
}));

export const STORAGE_KEYS = {
  workerProfile: 'heatshift.workerProfile.v1',
} as const;
