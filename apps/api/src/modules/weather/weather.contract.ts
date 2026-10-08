/**
 * Weather provider contract — intentionally NOT wired to any HTTP call yet.
 *
 * The heat-risk endpoint currently receives observations from the caller
 * (see POST /api/v1/heat-risk/preview). When a free provider is integrated,
 * implement this interface in weather.provider.ts and feed its output into
 * HeatRiskInput. No route is registered from this module on purpose, because
 * the API must not fake live weather.
 */
export type WeatherObservation = {
  location: { latitude: number; longitude: number; label: string };
  observedAt: string;
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  /** Derived hint for the heat-risk model. */
  sunExposure: 'full_sun' | 'partial_shade' | 'deep_shade' | 'indoor';
};

export type WeatherProvider = {
  readonly id: 'open-meteo' | 'imap' | 'other-free';
  fetchObservation(input: {
    latitude: number;
    longitude: number;
  }): Promise<WeatherObservation>;
};

export const WEATHER_PROVIDER_NOT_CONFIGURED =
  'No weather provider is configured. Send observations to POST /api/v1/heat-risk/preview.';
