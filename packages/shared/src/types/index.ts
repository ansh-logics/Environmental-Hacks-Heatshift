import type { z } from 'zod';
import type {
  accessLevelSchema,
  checkInStatusSchema,
  checkInSummaryResponseSchema,
  healthResponseSchema,
  heatLevelSchema,
  heatRiskComputedSchema,
  heatRiskLiveResponseSchema,
  heatRiskPreviewRequestSchema,
  reliefPointTypeSchema,
  sunExposureSchema,
  workerRoleSchema,
  workTypeSchema,
} from '../schemas';

/**
 * Domain vocabulary. Entity shapes (User, ReliefPoint, CheckIn, ...) are exported
 * from ../schemas next to their Zod schema; these aliases cover the enums and the
 * read models the UI works with.
 */
export type WorkerRole = z.output<typeof workerRoleSchema>;
export type WorkType = z.output<typeof workTypeSchema>;
export type ReliefPointType = z.output<typeof reliefPointTypeSchema>;
export type CheckInStatus = z.output<typeof checkInStatusSchema>;
export type AccessLevel = z.output<typeof accessLevelSchema>;
export type SunExposure = z.output<typeof sunExposureSchema>;
export type HeatLevel = z.output<typeof heatLevelSchema>;

export type ApiHealth = z.output<typeof healthResponseSchema>;
export type HeatRiskInput = z.output<typeof heatRiskPreviewRequestSchema>;
/** Model output, whichever endpoint produced it. */
export type HeatRiskResult = z.output<typeof heatRiskComputedSchema>;
/** The same plan plus the live observation it was built from. */
export type HeatRiskLiveResult = z.output<typeof heatRiskLiveResponseSchema>['data'];
export type CheckInSummary = z.output<typeof checkInSummaryResponseSchema>;

/** Path/message pair surfaced to the UI when request or response validation fails. */
export type ValidationIssue = {
  path: string;
  message: string;
};
