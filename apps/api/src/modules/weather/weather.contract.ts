import type { SunExposure, WeatherFreshness, WeatherProviderId } from '@heatshift/shared';

/**
 * Weather module boundary. The HTTP layer only ever talks to a `WeatherProvider`,
 * never to a vendor API directly, so the heat-risk model stays independent of
 * whichever provider is configured.
 */
export type WeatherObservation = {
  provider: WeatherProviderId;
  /** Coordinates actually sent upstream (the provider's own grid snap). */
  location: { latitude: number; longitude: number };
  /** True instant of the observation as UTC ISO-8601. */
  observedAt: string;
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  cloudCoverPercent: number | null;
  /** Derived hint: the heat-risk model needs sun load, not cloud %. */
  sunExposure: SunExposure;
};

export type WeatherLookup = {
  observation: WeatherObservation;
  freshness: WeatherFreshness;
};

export type WeatherProvider = {
  readonly id: WeatherProviderId;
  /** Resolves from cache when fresh; rejects with `WeatherUpstreamError` otherwise. */
  lookup(input: { latitude: number; longitude: number }): Promise<WeatherLookup>;
};
