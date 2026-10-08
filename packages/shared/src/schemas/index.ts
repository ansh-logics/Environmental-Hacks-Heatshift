import { z } from 'zod';
import {
  ACCESS_LEVELS,
  API_PREFIX,
  CHECK_IN_STATUSES,
  HEAT_LEVELS,
  RELIEF_POINT_TYPES,
  SUN_EXPOSURES,
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
/** ISO-8601 string as serialised by the API (PostgreSQL timestamps). */
export const timestampSchema = z.string();

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
});
export type ReliefPoint = z.output<typeof reliefPointSchema>;

export const listReliefPointsQuerySchema = z.object({
  type: reliefPointTypeSchema.optional(),
  verifiedOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
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
 * Heat risk
 * ------------------------------------------------------------------ */

/**
 * The weather inputs are supplied by the caller for now: no weather provider is
 * wired up yet, so the API must not pretend to fetch live conditions.
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

export const heatRiskPreviewResponseSchema = z.object({
  data: z.object({
    wbgtC: z.number(),
    score: z.number().int().min(0).max(100),
    level: heatLevelSchema,
    label: z.string(),
    headline: z.string(),
    plan: heatRiskPlanSchema,
    factors: z.array(heatRiskFactorSchema),
    input: heatRiskPreviewRequestSchema,
    meta: demoMetaSchema,
  }),
});
export type HeatRiskPreviewResponse = z.output<typeof heatRiskPreviewResponseSchema>;

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
} as const;
