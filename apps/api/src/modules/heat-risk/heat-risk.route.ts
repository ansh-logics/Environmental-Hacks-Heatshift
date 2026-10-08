import {
  API_PREFIX,
  HEAT_RISK_MODEL_LABEL,
  LIVE_WEATHER_SOURCE_LABEL,
  heatRiskLiveRequestSchema,
  heatRiskLiveResponseSchema,
  heatRiskPreviewRequestSchema,
  heatRiskPreviewResponseSchema,
  type HeatRiskInput,
} from '@heatshift/shared';
import type { FastifyInstance } from 'fastify';
import { computeHeatRisk } from './heat-risk.model';
import { getCurrentConditions } from '../weather/weather.service';
import type { WeatherObservation } from '../weather/weather.contract';

/** The model's documented domain; anything outside it is clamped, not invented. */
const MODEL_RANGE = {
  temperatureC: [-10, 60] as const,
  humidityPercent: [0, 100] as const,
  windSpeedKmh: [0, 150] as const,
};

function clamp(value: number, [min, max]: readonly [number, number]): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Live weather is reported verbatim in `weather`. The numbers handed to the
 * model are clamped to its supported domain so an extreme reading cannot make
 * the endpoint fail its own contract.
 *
 * Sun exposure is the one observation the worker keeps deciding: what their head
 * is under matters more to the plan than the cloud cover above it. The sky's own
 * exposure, derived from live cloud cover, stays visible in `weather`.
 */
function toModelInput(
  weather: WeatherObservation,
  profile: Omit<HeatRiskInput, 'temperatureC' | 'humidityPercent' | 'windSpeedKmh'>,
): HeatRiskInput {
  return {
    ...profile,
    temperatureC: clamp(weather.temperatureC, MODEL_RANGE.temperatureC),
    humidityPercent: clamp(weather.humidityPercent, MODEL_RANGE.humidityPercent),
    windSpeedKmh: clamp(weather.windSpeedKmh, MODEL_RANGE.windSpeedKmh),
  };
}

export async function heatRiskRoutes(app: FastifyInstance): Promise<void> {
  app.post(`${API_PREFIX}/heat-risk/preview`, async (request, reply) => {
    const input = heatRiskPreviewRequestSchema.parse(request.body);
    const result = computeHeatRisk(input);
    return reply.send(
      heatRiskPreviewResponseSchema.parse({
        data: {
          ...result,
          meta: {
            demo: true,
            source: `${HEAT_RISK_MODEL_LABEL} with caller-supplied observations`,
          },
        },
      }),
    );
  });

  app.post(`${API_PREFIX}/heat-risk/live`, async (request, reply) => {
    const body = heatRiskLiveRequestSchema.parse(request.body);
    const weather = await getCurrentConditions({
      latitude: body.latitude,
      longitude: body.longitude,
    });
    const result = computeHeatRisk(
      toModelInput(weather, {
        sunExposure: body.sunExposure,
        hoursInShift: body.hoursInShift,
        workType: body.workType,
        waterAccess: body.waterAccess,
        shadeAccess: body.shadeAccess,
        acclimatized: body.acclimatized,
      }),
    );

    return reply.send(
      heatRiskLiveResponseSchema.parse({
        data: {
          ...result,
          weather,
          coordinates: { latitude: body.latitude, longitude: body.longitude },
          source: LIVE_WEATHER_SOURCE_LABEL,
          model: HEAT_RISK_MODEL_LABEL,
        },
      }),
    );
  });
}
