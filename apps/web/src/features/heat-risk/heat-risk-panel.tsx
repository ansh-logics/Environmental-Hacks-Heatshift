import type { HeatRiskInput } from '@heatshift/shared';
import { WORK_TYPE_LABELS } from '@heatshift/shared';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Field } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { HEAT_RISK_PRESETS } from '../../lib/constants';
import { cn } from '../../lib/utils';
import type { PresetKey, WeatherDraft } from './use-shift-check';
import type { WorkerProfileDraft } from '../onboarding/profile';

/**
 * Weather is typed in (or picked from a preset) because no weather provider is
 * wired up yet. Work inputs come from the saved profile.
 */
export function HeatRiskPanel({
  profile,
  weather,
  sunExposure,
  activePreset,
  loading,
  onWeatherChange,
  onPreset,
  onRun,
}: {
  profile: WorkerProfileDraft;
  weather: WeatherDraft;
  sunExposure: HeatRiskInput['sunExposure'];
  activePreset: PresetKey | null;
  loading: boolean;
  onWeatherChange: (patch: Partial<WeatherDraft>) => void;
  onPreset: (key: PresetKey) => void;
  onRun: () => void;
}) {
  const numberField = (
    id: keyof WeatherDraft,
    label: string,
    min: number,
    max: number,
  ) => (
    <Field label={label} htmlFor={id}>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        value={weather[id]}
        onChange={(event) => onWeatherChange({ [id]: Number(event.target.value) })}
      />
    </Field>
  );

  return (
    <Card eyebrow="Step 2" title="What is the heat right now?">
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.entries(HEAT_RISK_PRESETS) as Array<[PresetKey, { label: string }]>).map(
          ([key, preset]) => (
            <button
              key={key}
              type="button"
              className={cn('chip', activePreset === key && 'chip-active')}
              onClick={() => onPreset(key)}
              aria-pressed={activePreset === key}
            >
              {preset.label}
            </button>
          ),
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {numberField('temperatureC', 'Temp °C', -10, 60)}
        {numberField('humidityPercent', 'Humidity %', 0, 100)}
        {numberField('windSpeedKmh', 'Wind km/h', 0, 150)}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-snug text-ink-500">
          Using {WORK_TYPE_LABELS[profile.workType].toLowerCase()}, {profile.hoursInShift}{' '}
          h shift, {sunExposure.replace('_', ' ')}, water {profile.waterAccess}.
        </p>
        <Button size="lg" loading={loading} onClick={onRun} className="w-full sm:w-auto">
          {loading ? 'Calculating' : 'Check my heat risk'}
        </Button>
      </div>
    </Card>
  );
}
