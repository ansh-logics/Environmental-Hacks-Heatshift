import { z } from 'zod';
import {
  ACCESS_LEVELS,
  API_PREFIX,
  CHECK_IN_STATUSES,
  HEAT_LEVELS,
  RELIEF_POINT_TYPES,
  SUN_EXPOSURES,
  WEATHER_PROVIDERS,
  WORKER_ROLES,
  WORK_TYPES,
} from '../constants';

/* ------------------------------------------------------------------ *
 * Enums
 * ------------------------------------------------------------------ */

export const workerRoleSchema = z.enum(WORKER_ROLES);
export const workTypeSchema = z.enum(WORK_TYPES);
export const reliefPointTypeSchema = z.enum(RELIEF_POINT_TYPES);
export const checkInStatusSchema = z.enum(CHECK_IN_STATUSES);
export const accessLevelSchema = z.enum(ACCESS_LEVELS);
export const sunExposureSchema = z.enum(SUN_EXPOSURES);
export const heatLevelSchema = z.enum(HEAT_LEVELS);

export const uuidSchema = z.uuid();
export const latitudeSchema = z.number().min(-90).max(90);
export const longitudeSchema = z.number().min(-180).max(180);
/** Same bounds, but accepting the string form query parameters arrive in. */
export const latitudeQuerySchema = z.coerce.number().min(-90).max(90);
export const longitudeQuerySchema = z.coerce.number().min(-180).max(180);
/** ISO-8601 string as serialised by the API (PostgreSQL timestamps). */
export const timestampSchema = z.string();

export const coordinatePairSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});
export type CoordinatePair = z.output<typeof coordinatePairSchema>;

/* ------------------------------------------------------------------ *
 * Common envelopes
 * ------------------------------------------------------------------ */

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    /** Validation details for 4xx responses; present only when useful. */
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.output<typeof apiErrorSchema>;

export const demoMetaSchema = z.object({
  /** true while the dataset comes from the committed seed, not a live source. */
  demo: z.literal(true),
  source: z.string(),
});
export type DemoMeta = z.output<typeof demoMetaSchema>;

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  service: z.string(),
  version: z.string(),
  environment: z.string(),
  uptimeSeconds: z.number().nonnegative(),
  database: z.enum(['up', 'down']),
  timestamp: timestampSchema,
});
export type HealthResponse = z.output<typeof healthResponseSchema>;

/* ------------------------------------------------------------------ *
 * Users & worker profiles (no auth yet — mock identity)
 * ------------------------------------------------------------------ */

export const userSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  role: workerRoleSchema,
  createdAt: timestampSchema,
});
export type User = z.output<typeof userSchema>;

export const workerProfileSchema = z.object({
  userId: uuidSchema,
  workType: workTypeSchema,
  city: z.string().min(1),
  defaultShiftStart: z.string(),
  defaultShiftEnd: z.string(),
  waterAccess: accessLevelSchema,
  shadeAccess: accessLevelSchema,
});
export type WorkerProfile = z.output<typeof workerProfileSchema>;

/* ------------------------------------------------------------------ *
 * Relief points
 * ------------------------------------------------------------------ */

export const reliefPointSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  type: reliefPointTypeSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  address: z.string(),
  verified: z.boolean(),
  openingHours: z.string(),
  createdAt: timestampSchema,
  /**
   * Straight-line km from the caller's coordinates. Only present when the
   * request carried a location, so location-less responses stay as they were.
   */
  distanceKm: z.number().nonnegative().optional(),
});
export type ReliefPoint = z.output<typeof reliefPointSchema>;

export const listReliefPointsQuerySchema = z
  .object({
    type: reliefPointTypeSchema.optional(),
    verifiedOnly: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === 'true'),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    latitude: latitudeQuerySchema.optional(),
    longitude: longitudeQuerySchema.optional(),
  })
  .refine((value) => (value.latitude === undefined) === (value.longitude === undefined), {
    message: 'latitude and longitude must be sent together',
  });
export type ListReliefPointsQuery = z.output<typeof listReliefPointsQuerySchema>;

export const reliefPointListResponseSchema = z.object({
  data: z.array(reliefPointSchema),
  count: z.number().int().nonnegative(),
  meta: demoMetaSchema,
});
export type ReliefPointListResponse = z.output<typeof reliefPointListResponseSchema>;

/* ------------------------------------------------------------------ *
 * Check-ins
 * ------------------------------------------------------------------ */

export const createCheckInSchema = z
  .object({
    userId: uuidSchema,
    status: checkInStatusSchema,
    /** Both or neither: a lone coordinate is not usable for routing help. */
    latitude: latitudeSchema.optional(),
    longitude: longitudeSchema.optional(),
  })
  .refine((value) => (value.latitude === undefined) === (value.longitude === undefined), {
    message: 'latitude and longitude must be sent together',
  });
export type CreateCheckInInput = z.output<typeof createCheckInSchema>;

export const checkInSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  status: checkInStatusSchema,
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  createdAt: timestampSchema,
});
export type CheckIn = z.output<typeof checkInSchema>;

export const checkInCreateResponseSchema = z.object({
  data: checkInSchema,
});
export type CheckInCreateResponse = z.output<typeof checkInCreateResponseSchema>;

export const checkInSummaryQuerySchema = z.object({
  userId: uuidSchema.optional(),
  /** Number of hours of history folded into the summary. */
  windowHours: z.coerce.number().int().min(1).max(168).default(24),
});
export type CheckInSummaryQuery = z.output<typeof checkInSummaryQuerySchema>;

export const checkInStatusCountsSchema = z.object({
  okay: z.number().int().nonnegative(),
  need_water: z.number().int().nonnegative(),
  need_break: z.number().int().nonnegative(),
  unwell: z.number().int().nonnegative(),
});
export type CheckInStatusCounts = z.output<typeof checkInStatusCountsSchema>;

export const checkInSummaryResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  windowHours: z.number().int().positive(),
  inWindow: z.number().int().nonnegative(),
  uniqueWorkers: z.number().int().nonnegative(),
  byStatus: checkInStatusCountsSchema,
  latest: z.array(checkInSchema),
  generatedAt: timestampSchema,
  meta: demoMetaSchema,
});
export type CheckInSummaryResponse = z.output<typeof checkInSummaryResponseSchema>;

/* ------------------------------------------------------------------ *
 * Live weather
 * ------------------------------------------------------------------ */

export const weatherProviderSchema = z.enum(WEATHER_PROVIDERS);

/** How much of the sky is clouded, and the shift hint the model needs from it. */
export const weatherFreshnessSchema = z.object({
  provider: weatherProviderSchema,
  /** When this process last talked to the provider for the cache cell. */
  fetchedAt: timestampSchema,
  observedAt: timestampSchema,
  ageSeconds: z.number().nonnegative(),
  cacheTtlSeconds: z.number().int().positive(),
  /** true when served from this process's memory instead of the provider. */
  cached: z.boolean(),
  /** Rounded cache cell, never the exact coordinates that were requested. */
  cacheCell: z.string(),
  /** The cache lives in one Node process; a second instance starts empty. */
  cacheScope: z.literal('per-process'),
});
export type WeatherFreshness = z.output<typeof weatherFreshnessSchema>;

export const weatherObservationSchema = z.object({
  temperatureC: z.number(),
  humidityPercent: z.number().min(0).max(100),
  windSpeedKmh: z.number().min(0),
  /** null when the provider does not return cloud cover for this location. */
  cloudCoverPercent: z.number().min(0).max(100).nullable(),
  /** Derived hint so the heat-risk model can account for sun load. */
  sunExposure: sunExposureSchema,
  observedAt: timestampSchema,
  provider: weatherProviderSchema,
  /** Coordinates actually sent to the provider (rounded to its grid). */
  location: coordinatePairSchema,
  freshness: weatherFreshnessSchema,
  source: z.string(),
});
export type WeatherObservation = z.output<typeof weatherObservationSchema>;

export const weatherConditionsQuerySchema = z.object({
  latitude: latitudeQuerySchema,
  longitude: longitudeQuerySchema,
});
export type WeatherConditionsQuery = z.output<typeof weatherConditionsQuerySchema>;

export const weatherConditionsResponseSchema = z.object({
  data: weatherObservationSchema,
});
export type WeatherConditionsResponse = z.output<typeof weatherConditionsResponseSchema>;

/* ------------------------------------------------------------------ *
 * Heat risk
 * ------------------------------------------------------------------ */

/**
 * Manual/demo path: the caller supplies the observation, so this endpoint can
 * run without a provider and stays useful for demos and tests.
 */
export const heatRiskPreviewRequestSchema = z.object({
  temperatureC: z.number().min(-10).max(60),
  humidityPercent: z.number().min(0).max(100),
  windSpeedKmh: z.coerce.number().min(0).max(150),
  sunExposure: sunExposureSchema,
  hoursInShift: z.coerce.number().min(0.5).max(16),
  workType: workTypeSchema,
  waterAccess: accessLevelSchema,
  shadeAccess: accessLevelSchema.default('limited'),
  acclimatized: z.boolean().default(true),
});
export type HeatRiskPreviewRequest = z.output<typeof heatRiskPreviewRequestSchema>;

/**
 * Live path: only a position plus the worker profile; the numbers come from the
 * provider. `sunExposure` stays with the worker - what they are standing under
 * beats the cloud cover above it for planning purposes.
 */
export const heatRiskLiveRequestSchema = heatRiskPreviewRequestSchema
  .omit({ temperatureC: true, humidityPercent: true, windSpeedKmh: true })
  .extend({
    latitude: latitudeSchema,
    longitude: longitudeSchema,
  });
export type HeatRiskLiveRequest = z.output<typeof heatRiskLiveRequestSchema>;

export const heatRiskPlanSchema = z.object({
  /** Work minutes inside one work/rest cycle before the worker should stop. */
  workMinutesPerCycle: z.number().int().nonnegative(),
  restMinutesPerCycle: z.number().int().nonnegative(),
  waterMlPerHour: z.number().int().nonnegative(),
  maxRecommendedShiftMinutes: z.number().int().nonnegative(),
  /** Local-time hour (0-23) after which the requested shift becomes unsafe. */
  unsafeStartHour: z.number().int().min(0).max(23),
  advice: z.array(z.string()),
});
export type HeatRiskPlan = z.output<typeof heatRiskPlanSchema>;

export const heatRiskFactorSchema = z.object({
  factor: z.string(),
  impact: z.string(),
});
export type HeatRiskFactor = z.output<typeof heatRiskFactorSchema>;

/**
 * Everything the model produces, before anyone says where the numbers came
 * from. Both the preview and the live response are built on this, so a plan
 * renders identically whichever route supplied it.
 */
export const heatRiskComputedSchema = z.object({
  wbgtC: z.number(),
  score: z.number().int().min(0).max(100),
  level: heatLevelSchema,
  label: z.string(),
  headline: z.string(),
  plan: heatRiskPlanSchema,
  factors: z.array(heatRiskFactorSchema),
  /** The observation and profile the model was actually given. */
  input: heatRiskPreviewRequestSchema,
});
export type HeatRiskComputed = z.output<typeof heatRiskComputedSchema>;

export const heatRiskPreviewResponseSchema = z.object({
  data: heatRiskComputedSchema.extend({ meta: demoMetaSchema }),
});
export type HeatRiskPreviewResponse = z.output<typeof heatRiskPreviewResponseSchema>;

export const heatRiskLiveResponseSchema = z.object({
  data: heatRiskComputedSchema.extend({
    weather: weatherObservationSchema,
    /** Position the provider was queried with. */
    coordinates: coordinatePairSchema,
    /** e.g. "Live weather via Open-Meteo". */
    source: z.string(),
    /** e.g. "HeatShift WBGT model v0.1" - the maths is still a heuristic. */
    model: z.string(),
  }),
});
export type HeatRiskLiveResponse = z.output<typeof heatRiskLiveResponseSchema>;

/* ------------------------------------------------------------------ *
 * Route contract map (documents every endpoint of this phase)
 * ------------------------------------------------------------------ */

export const apiRoutes = {
  health: { method: 'GET', path: '/health', response: healthResponseSchema },
  reliefPoints: {
    method: 'GET',
    path: `${API_PREFIX}/relief-points`,
    query: listReliefPointsQuerySchema,
    response: reliefPointListResponseSchema,
  },
  createCheckIn: {
    method: 'POST',
    path: `${API_PREFIX}/check-ins`,
    body: createCheckInSchema,
    response: checkInCreateResponseSchema,
  },
  checkInSummary: {
    method: 'GET',
    path: `${API_PREFIX}/check-ins/summary`,
    query: checkInSummaryQuerySchema,
    response: checkInSummaryResponseSchema,
  },
  heatRiskPreview: {
    method: 'POST',
    path: `${API_PREFIX}/heat-risk/preview`,
    body: heatRiskPreviewRequestSchema,
    response: heatRiskPreviewResponseSchema,
  },
  weatherConditions: {
    method: 'GET',
    path: `${API_PREFIX}/weather/conditions`,
    query: weatherConditionsQuerySchema,
    response: weatherConditionsResponseSchema,
  },
  heatRiskLive: {
    method: 'POST',
    path: `${API_PREFIX}/heat-risk/live`,
    body: heatRiskLiveRequestSchema,
    response: heatRiskLiveResponseSchema,
  },
} as const;
