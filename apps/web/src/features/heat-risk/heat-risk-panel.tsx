import { useState } from 'react';
import { WORK_TYPE_LABELS, type HeatRiskInput } from '@heatshift/shared';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Field } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { ErrorNote } from '../../components/shared/error-note';
import { Skeleton } from '../../components/ui/skeleton';
import { useAppState } from '../../app/providers';
import { HEAT_RISK_PRESETS } from '../../lib/constants';
import { HeatRiskResultCard } from './heat-risk-result';
import { useHeatRiskPreview } from './use-heat-risk';

/**
 * Weather is typed in (or picked from a preset) because no weather provider is
 * wired up yet. Work inputs come from the saved profile.
 */
export function HeatRiskPanel() {
  const { profile } = useAppState();
  const [weather, setWeather] = useState<{
    temperatureC: number;
    humidityPercent: number;
    windSpeedKmh: number;
  }>({
    temperatureC: HEAT_RISK_PRESETS.delhiNoon.temperatureC,
    humidityPercent: HEAT_RISK_PRESETS.delhiNoon.humidityPercent,
    windSpeedKmh: HEAT_RISK_PRESETS.delhiNoon.windSpeedKmh,
  });
  const { result, error, loading, preview } = useHeatRiskPreview();

  const runPreview = (override?: Partial<HeatRiskInput>) =>
    preview({
      ...weather,
      sunExposure: profile.sunExposure,
      hoursInShift: profile.hoursInShift,
      workType: profile.workType,
      waterAccess: profile.waterAccess,
      shadeAccess: profile.shadeAccess,
      acclimatized: profile.acclimatized,
      ...override,
    });

  return (
    <>
      <Card eyebrow="Step 2" title="What is the heat right now?">
        <div className="mb-3 flex flex-wrap gap-2">
          {Object.entries(HEAT_RISK_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              className="chip"
              onClick={() => {
                setWeather({
                  temperatureC: preset.temperatureC,
                  humidityPercent: preset.humidityPercent,
                  windSpeedKmh: preset.windSpeedKmh,
                });
                void runPreview({ sunExposure: preset.sunExposure });
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Temp °C" htmlFor="temp">
            <Input
              id="temp"
              type="number"
              inputMode="decimal"
              min={-10}
              max={60}
              value={weather.temperatureC}
              onChange={(event) =>
                setWeather({ ...weather, temperatureC: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Humidity %" htmlFor="humidity">
            <Input
              id="humidity"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={weather.humidityPercent}
              onChange={(event) =>
                setWeather({ ...weather, humidityPercent: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Wind km/h" htmlFor="wind">
            <Input
              id="wind"
              type="number"
              inputMode="numeric"
              min={0}
              max={150}
              value={weather.windSpeedKmh}
              onChange={(event) =>
                setWeather({ ...weather, windSpeedKmh: Number(event.target.value) })
              }
            />
          </Field>
        </div>

        <p className="mt-3 text-xs text-ink-500">
          Using {WORK_TYPE_LABELS[profile.workType].toLowerCase()}, {profile.hoursInShift}{' '}
          h shift, {profile.sunExposure.replace('_', ' ')}, water {profile.waterAccess}.
        </p>

        <Button
          className="mt-3 w-full"
          size="lg"
          loading={loading}
          onClick={() => void runPreview()}
        >
          {loading ? 'Calculating' : 'Check my heat risk'}
        </Button>
      </Card>

      {error ? <ErrorNote message={error} /> : null}
      {loading && !result ? <Skeleton className="h-64" /> : null}
      {result && !loading ? <HeatRiskResultCard result={result} /> : null}
    </>
  );
}
