import {
  ACCESS_LEVEL_LABELS,
  SUN_EXPOSURE_LABELS,
  WORK_TYPE_LABELS,
  type SunExposure,
} from '@heatshift/shared';
import { Card } from '../../components/ui/card';
import type { WorkerProfileDraft } from '../onboarding/profile';

/** Everything the heat calculation is about to use, in one scannable list. */
export function ShiftSnapshotCard({
  profile,
  sunExposure,
  locationLabel,
  weather,
  weatherLabel = 'Weather input',
}: {
  profile: WorkerProfileDraft;
  sunExposure: SunExposure;
  locationLabel: string;
  weather: { temperatureC: number; humidityPercent: number; windSpeedKmh: number };
  weatherLabel?: string;
}) {
  const rows: Array<[string, string]> = [
    ['Work', WORK_TYPE_LABELS[profile.workType]],
    ['Location', locationLabel],
    ['Shift', `${profile.shiftStart}-${profile.shiftEnd} (${profile.hoursInShift} h)`],
    ['Sun', SUN_EXPOSURE_LABELS[sunExposure]],
    ['Water', ACCESS_LEVEL_LABELS[profile.waterAccess]],
    ['Shade', ACCESS_LEVEL_LABELS[profile.shadeAccess]],
    ['Acclimatised', profile.acclimatized ? 'Yes' : 'No'],
    [
      weatherLabel,
      `${weather.temperatureC} °C, ${weather.humidityPercent}% RH, ${weather.windSpeedKmh} km/h`,
    ],
  ];

  return (
    <Card eyebrow="Overview" title="Shift snapshot" variant="quiet">
      <dl className="divide-y divide-sand-200 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3 py-2">
            <dt className="shrink-0 font-semibold text-ink-500">{label}</dt>
            <dd className="min-w-0 text-right font-semibold text-ink-900">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs leading-snug text-ink-500">
        Change these answers in “Tell us how you work”.
      </p>
    </Card>
  );
}
