import {
  SUN_EXPOSURE_LABELS,
  WORK_TYPE_LABELS,
  type HeatRiskResult,
  type SunExposure,
  type HeatLevel,
} from '@heatshift/shared';
import { Button } from '../../components/ui/button';
import { Badge, type BadgeTone } from '../../components/ui/badge';
import {
  IconClock,
  IconDrop,
  IconPin,
  IconShade,
  IconSun,
} from '../../components/ui/icons';
import { MetaChip } from '../../components/layout/page-header';
import { ACCESS_LEVEL_LABELS } from '@heatshift/shared';
import type { WorkerProfileDraft } from '../onboarding/profile';

const TONE_BY_LEVEL: Record<HeatLevel, BadgeTone> = {
  low: 'low',
  moderate: 'moderate',
  high: 'high',
  severe: 'severe',
};

/**
 * Dashboard entry point: who you are, how long you are out there, and the one
 * action that matters next.
 */
export function ShiftHero({
  name,
  profile,
  sunExposure,
  result,
  loading,
  onCheck,
}: {
  name: string;
  profile: WorkerProfileDraft;
  sunExposure: SunExposure;
  result: HeatRiskResult | null;
  loading: boolean;
  onCheck: () => void;
}) {
  return (
    <section className="card lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">My shift</p>
            {result ? (
              <Badge tone={TONE_BY_LEVEL[result.level]}>{result.label}</Badge>
            ) : null}
          </div>
          <h1 className="mt-1 text-2xl leading-tight lg:text-3xl">Hello, {name}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {WORK_TYPE_LABELS[profile.workType]} - {profile.city}
          </p>

          <ul className="mt-4 flex flex-wrap gap-2">
            <MetaChip icon={<IconClock size={14} />}>
              {profile.shiftStart}-{profile.shiftEnd} - {profile.hoursInShift} h planned
            </MetaChip>
            <MetaChip icon={<IconPin size={14} />}>{profile.city}</MetaChip>
            <MetaChip icon={<IconSun size={14} />}>
              {SUN_EXPOSURE_LABELS[sunExposure]}
            </MetaChip>
            <MetaChip icon={<IconDrop size={14} />}>
              Water: {ACCESS_LEVEL_LABELS[profile.waterAccess]}
            </MetaChip>
            <MetaChip icon={<IconShade size={14} />}>
              Shade: {ACCESS_LEVEL_LABELS[profile.shadeAccess]}
            </MetaChip>
          </ul>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
          <Button
            size="lg"
            loading={loading}
            onClick={onCheck}
            className="w-full sm:w-auto"
          >
            {loading ? 'Calculating' : result ? 'Re-check heat risk' : 'Check heat risk'}
          </Button>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-500">
        {result
          ? `Last run used ${result.input.temperatureC} °C, ${result.input.humidityPercent}% humidity, ${result.input.windSpeedKmh} km/h wind.`
          : 'No plan calculated yet - set your numbers below, then run the check.'}
      </p>
    </section>
  );
}
