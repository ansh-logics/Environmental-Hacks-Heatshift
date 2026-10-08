import type { AccessLevel, SunExposure, WorkType } from '@heatshift/shared';

/** What the worker told us locally; nothing is sent to the API yet (no auth). */
export type WorkerProfileDraft = {
  workType: WorkType;
  city: string;
  shiftStart: string;
  shiftEnd: string;
  hoursInShift: number;
  waterAccess: AccessLevel;
  shadeAccess: AccessLevel;
  sunExposure: SunExposure;
  acclimatized: boolean;
};

export const DEFAULT_PROFILE: WorkerProfileDraft = {
  workType: 'delivery_rider',
  city: 'New Delhi',
  shiftStart: '10:00',
  shiftEnd: '20:00',
  hoursInShift: 8,
  waterAccess: 'limited',
  shadeAccess: 'none',
  sunExposure: 'full_sun',
  acclimatized: true,
};

export function isProfileComplete(profile: WorkerProfileDraft): boolean {
  return profile.city.trim().length > 1;
}
