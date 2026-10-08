import type { WeatherObservation } from '@heatshift/shared';
import { WEATHER_SOURCE_LABEL, openMeteoProvider } from './weather.provider';

/**
 * The one place the API turns a provider lookup into the response shape. Both
 * GET /weather/conditions and POST /heat-risk/live call this in-process, so no
 * route ever makes an HTTP request to another route.
 */
export async function getCurrentConditions(input: {
  latitude: number;
  longitude: number;
}): Promise<WeatherObservation> {
  const { observation, freshness } = await openMeteoProvider.lookup(input);
  return { ...observation, freshness, source: WEATHER_SOURCE_LABEL };
}
