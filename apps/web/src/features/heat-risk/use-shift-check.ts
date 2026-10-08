import { useCallback, useState } from 'react';
import type { HeatRiskInput, SunExposure } from '@heatshift/shared';
import { HEAT_RISK_PRESETS } from '../../lib/constants';
import type { WorkerProfileDraft } from '../onboarding/profile';
import { useHeatRiskPreview } from './use-heat-risk';

export type WeatherDraft = Pick<
  HeatRiskInput,
  'temperatureC' | 'humidityPercent' | 'windSpeedKmh'
>;

const DEFAULT_WEATHER: WeatherDraft = {
  temperatureC: HEAT_RISK_PRESETS.delhiNoon.temperatureC,
  humidityPercent: HEAT_RISK_PRESETS.delhiNoon.humidityPercent,
  windSpeedKmh: HEAT_RISK_PRESETS.delhiNoon.windSpeedKmh,
};

export type PresetKey = keyof typeof HEAT_RISK_PRESETS;

/**
 * Owns the heat-risk request for the whole dashboard: the greeting band's
 * primary action and the input panel drive the same state, so one run feeds
 * the plan, the snapshot and the safety card.
 */
export function useShiftCheck(profile: WorkerProfileDraft) {
  const [weather, setWeatherState] = useState<WeatherDraft>(DEFAULT_WEATHER);
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
  const [sunOverride, setSunOverride] = useState<SunExposure | null>(null);
  const { result, error, loading, preview } = useHeatRiskPreview();

  const setWeather = useCallback((patch: Partial<WeatherDraft>) => {
    setWeatherState((current) => ({ ...current, ...patch }));
    setActivePreset(null);
  }, []);

  const run = useCallback(
    (override?: Partial<HeatRiskInput>) =>
      preview({
        ...weather,
        sunExposure: sunOverride ?? profile.sunExposure,
        hoursInShift: profile.hoursInShift,
        workType: profile.workType,
        waterAccess: profile.waterAccess,
        shadeAccess: profile.shadeAccess,
        acclimatized: profile.acclimatized,
        ...override,
      }),
    [preview, profile, sunOverride, weather],
  );

  const applyPreset = useCallback(
    (key: PresetKey) => {
      const preset = HEAT_RISK_PRESETS[key];
      const next: WeatherDraft = {
        temperatureC: preset.temperatureC,
        humidityPercent: preset.humidityPercent,
        windSpeedKmh: preset.windSpeedKmh,
      };
      setWeatherState(next);
      setActivePreset(key);
      setSunOverride(preset.sunExposure);
      void run({ ...next, sunExposure: preset.sunExposure });
    },
    [run],
  );

  return {
    weather,
    setWeather,
    activePreset,
    applyPreset,
    run,
    result,
    error,
    loading,
    sunExposure: sunOverride ?? profile.sunExposure,
  };
}
