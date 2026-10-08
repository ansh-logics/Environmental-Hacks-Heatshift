/**
 * Domain vocabulary for HeatShift. Both the API and the web app import these so
 * labels, enums and limits never drift apart.
 */

export const APP_NAME = 'HeatShift';
export const API_PREFIX = '/api/v1';

/** Shown wherever data comes from the committed seed set rather than a live source. */
export const DEMO_DATA_NOTICE = 'Demo data — seeded Delhi dataset, not field-verified';

export const WORKER_ROLES = ['worker', 'coordinator'] as const;

export const WORK_TYPES = [
  'delivery_rider',
  'security_guard',
  'construction',
  'street_vendor',
  'sanitation',
  'other',
] as const;

export const RELIEF_POINT_TYPES = [
  'water',
  'shade',
  'clinic',
  'cooling_space',
  'canteen',
] as const;

export const CHECK_IN_STATUSES = ['okay', 'need_water', 'need_break', 'unwell'] as const;

/** How reliably the worker can reach drinking water / shade during a shift. */
export const ACCESS_LEVELS = ['none', 'limited', 'reliable'] as const;

/** Sun exposure of the work location, used by the heat-risk model. */
export const SUN_EXPOSURES = [
  'full_sun',
  'partial_shade',
  'deep_shade',
  'indoor',
] as const;

export const HEAT_LEVELS = ['low', 'moderate', 'high', 'severe'] as const;

export const WORK_TYPE_LABELS: Record<(typeof WORK_TYPES)[number], string> = {
  delivery_rider: 'Delivery rider',
  security_guard: 'Security guard',
  construction: 'Construction worker',
  street_vendor: 'Street vendor',
  sanitation: 'Sanitation worker',
  other: 'Other outdoor work',
};

export const RELIEF_POINT_TYPE_LABELS: Record<
  (typeof RELIEF_POINT_TYPES)[number],
  string
> = {
  water: 'Drinking water',
  shade: 'Shade spot',
  clinic: 'Clinic / first aid',
  cooling_space: 'Cooling space',
  canteen: 'Canteen / rest point',
};

export const CHECK_IN_STATUS_LABELS: Record<(typeof CHECK_IN_STATUSES)[number], string> =
  {
    okay: 'I am okay',
    need_water: 'I need water',
    need_break: 'I need a break',
    unwell: 'I feel unwell',
  };

export const ACCESS_LEVEL_LABELS: Record<(typeof ACCESS_LEVELS)[number], string> = {
  none: 'No access',
  limited: 'Limited access',
  reliable: 'Reliable access',
};

export const SUN_EXPOSURE_LABELS: Record<(typeof SUN_EXPOSURES)[number], string> = {
  full_sun: 'Open sun',
  partial_shade: 'Partly shaded',
  deep_shade: 'Fully shaded',
  indoor: 'Indoor, no direct sun',
};

export const HEAT_LEVEL_LABELS: Record<(typeof HEAT_LEVELS)[number], string> = {
  low: 'Low risk',
  moderate: 'Moderate risk',
  high: 'High risk',
  severe: 'Severe risk',
};

/** One-line guidance shown next to a heat level. */
export const HEAT_LEVEL_HEADLINES: Record<(typeof HEAT_LEVELS)[number], string> = {
  low: 'Safe to work normally. Keep sipping water.',
  moderate: 'Slow down and plan shaded rest breaks.',
  high: 'Shorten your shift blocks and hydrate on a schedule.',
  severe: 'Stop non-essential work. Find shade, water or a cooling space now.',
};

/** WBGT (°C) thresholds. Roughly follows OSHA / ICMR heat guidance bands. */
export const HEAT_LEVEL_WBGT_THRESHOLDS: Record<(typeof HEAT_LEVELS)[number], number> = {
  low: 0,
  moderate: 28,
  high: 30,
  severe: 32.5,
};

/** Placeholder identity used until real authentication exists. */
export const MOCK_WORKER_ID = '00000000-0000-4000-8000-000000000001';
export const MOCK_WORKER_NAME = 'Demo rider — Delhi NCR';

export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  relief: '/relief',
  coordinator: '/coordinator',
} as const;
