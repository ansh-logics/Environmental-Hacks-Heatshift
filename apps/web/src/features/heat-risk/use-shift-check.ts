import { useCallback, useState } from 'react';
import type { HeatRiskInput, HeatRiskLiveRequest, SunExposure } from '@heatshift/shared';
import { HEAT_RISK_PRESETS } from '../../lib/constants';
import type { WorkerProfileDraft } from '../onboarding/profile';
import { useHeatRiskPreview } from './use-heat-risk';
import { useLiveHeatRisk } from './use-live-heat-risk';

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
 * Owns the heat-risk plan for the whole dashboard, from either source: the
 * manual preview the worker types, or a live plan built from a position they
 * agreed to share. One plan is on screen at a time, so the greeting band, the
 * snapshot and the safety card can never disagree about which one it is.
 *
 * A live plan wins until the worker runs the manual check again, which drops it.
 */
export function useShiftCheck(profile: WorkerProfileDraft) {
  const [weather, setWeatherState] = useState<WeatherDraft>(DEFAULT_WEATHER);
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
  const [sunOverride, setSunOverride] = useState<SunExposure | null>(null);
  const {
    result: manual,
    error: manualError,
    loading: manualLoading,
    preview,
  } = useHeatRiskPreview();
  const {
    result: live,
    error: liveError,
    loading: liveLoading,
    runLive,
    clearLive,
  } = useLiveHeatRisk();

  const setWeather = useCallback((patch: Partial<WeatherDraft>) => {
    setWeatherState((current) => ({ ...current, ...patch }));
    setActivePreset(null);
  }, []);

  const run = useCallback(
    (override?: Partial<HeatRiskInput>) => {
      clearLive();
      return preview({
        ...weather,
        sunExposure: sunOverride ?? profile.sunExposure,
        hoursInShift: profile.hoursInShift,
        workType: profile.workType,
        waterAccess: profile.waterAccess,
        shadeAccess: profile.shadeAccess,
        acclimatized: profile.acclimatized,
        ...override,
      });
    },
    [clearLive, preview, profile, sunOverride, weather],
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

  /**
   * The last manual plan stays on screen while the live one is in flight, then
   * is replaced by it - a slow provider should not blank the card out.
   */
  const requestLive = useCallback(
    (input: HeatRiskLiveRequest) => void runLive(input),
    [runLive],
  );

  return {
    weather,
    setWeather,
    activePreset,
    applyPreset,
    run,
    requestLive,
    result: live ?? manual,
    /** Set only when the plan on screen came from live weather. */
    liveResult: live,
    liveLoading,
    /** The manual panel must not look busy while only a live request is running. */
    manualLoading,
    /** Kept apart from the manual error so each card reports its own failure. */
    liveError,
    error: manualError,
    loading: liveLoading || manualLoading,
    sunExposure: sunOverride ?? profile.sunExposure,
  };
}
