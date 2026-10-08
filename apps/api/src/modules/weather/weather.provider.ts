import {
  LIVE_WEATHER_SOURCE_LABEL,
  WEATHER_CACHE_CELL_DEGREES,
  WEATHER_CACHE_TTL_SECONDS,
  type SunExposure,
  type WeatherFreshness,
} from '@heatshift/shared';
import { z } from 'zod';
import { UpstreamError } from '../../lib/errors';
import type {
  WeatherLookup,
  WeatherObservation,
  WeatherProvider,
} from './weather.contract';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const UPSTREAM_TIMEOUT_MS = 6000;
const QUERY =
  'current=temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover' +
  '&wind_speed_unit=kmh&timezone=auto&forecast_days=1';

export { LIVE_WEATHER_SOURCE_LABEL as WEATHER_SOURCE_LABEL };

/**
 * Only the fields this provider reads. Remote JSON is never trusted: unknown
 * keys are ignored, and anything missing or out of range fails the parse so we
 * can report an upstream problem instead of computing nonsense.
 */
const openMeteoResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  utc_offset_seconds: z.number().int(),
  current: z.object({
    /** Wall-clock time in the requested timezone, without an offset suffix. */
    time: z.string().min(1),
    temperature_2m: z.number().min(-60).max(60),
    relative_humidity_2m: z.number().min(0).max(100),
    wind_speed_10m: z.number().min(0).max(400),
    cloud_cover: z.number().min(0).max(100).optional(),
  }),
});
type OpenMeteoResponse = z.output<typeof openMeteoResponseSchema>;

/**
 * Cloud cover is the only sun-load signal a single observation gives us, so
 * this mapping is a deliberate approximation: a rider under a flyover still
 * reads as "open sky" to a satellite.
 */
export function sunExposureFromCloud(cloudCoverPercent: number | null): SunExposure {
  if (cloudCoverPercent === null) return 'partial_shade';
  if (cloudCoverPercent < 20) return 'full_sun';
  if (cloudCoverPercent < 70) return 'partial_shade';
  return 'deep_shade';
}

/** Coarse cell label, e.g. "28.6,77.2". Deliberately not exact coordinates. */
export function cacheCellOf(latitude: number, longitude: number): string {
  const cell = (coordinate: number) =>
    (
      Math.round(coordinate / WEATHER_CACHE_CELL_DEGREES) * WEATHER_CACHE_CELL_DEGREES
    ).toFixed(1);
  return `${cell(latitude)},${cell(longitude)}`;
}

type CacheEntry = {
  observation: WeatherObservation;
  fetchedAt: string;
  expiresAt: number;
};

/**
 * Process-local weather cache, keyed on a ~0.1 degree cell (roughly 10 km,
 * coarser than Open-Meteo's own 1-3 km grid) so a whole rider group in one
 * market costs a single upstream call per 10 minutes. Failed lookups are never
 * stored, and concurrent requests for the same cell share one in-flight call.
 *
 * This is per-process and single-instance only: a second API replica or a
 * restart starts empty. Fine for the current demo scale; swap for a shared
 * cache before running more than one replica.
 */
class WeatherCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly inflight = new Map<string, Promise<WeatherObservation>>();

  read(key: string, now: number): CacheEntry | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= now) {
      this.entries.delete(key);
      return undefined;
    }
    return entry;
  }

  write(key: string, entry: CacheEntry): void {
    for (const [existing, value] of this.entries) {
      if (value.expiresAt <= Date.now()) this.entries.delete(existing);
    }
    this.entries.set(key, entry);
  }

  async shared(key: string, work: () => Promise<WeatherObservation>) {
    const pending = this.inflight.get(key);
    if (pending) return pending;
    const promise = work().finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise);
    return promise;
  }
}

function toInstant(localTime: string, utcOffsetSeconds: number): string {
  // `current.time` is local wall-clock; parse it as UTC then back off the
  // offset the provider reports to recover the true instant.
  const asUtc = Date.parse(`${localTime}Z`);
  if (Number.isNaN(asUtc)) {
    throw new UpstreamError('The weather provider sent an unreadable observation time.', {
      statusCode: 502,
    });
  }
  return new Date(asUtc - utcOffsetSeconds * 1000).toISOString();
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function toObservation(payload: OpenMeteoResponse): WeatherObservation {
  const cloudCoverPercent = payload.current.cloud_cover ?? null;
  return {
    provider: 'open-meteo',
    // The provider's snapped grid point, not the coordinates we asked for.
    location: {
      latitude: Number(payload.latitude.toFixed(4)),
      longitude: Number(payload.longitude.toFixed(4)),
    },
    observedAt: toInstant(payload.current.time, payload.utc_offset_seconds),
    temperatureC: round1(payload.current.temperature_2m),
    humidityPercent: Math.round(payload.current.relative_humidity_2m),
    windSpeedKmh: round1(payload.current.wind_speed_10m),
    cloudCoverPercent,
    sunExposure: sunExposureFromCloud(cloudCoverPercent),
  };
}

async function fetchObservation(
  fetchImpl: typeof fetch,
  latitude: number,
  longitude: number,
): Promise<WeatherObservation> {
  const url = `${OPEN_METEO_URL}?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}&${QUERY}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { accept: 'application/json', 'user-agent': 'heatshift-api/0.1' },
    });
  } catch (cause) {
    if (controller.signal.aborted) {
      throw new UpstreamError(
        `The weather provider did not answer within ${UPSTREAM_TIMEOUT_MS / 1000}s. Try again in a moment.`,
        { statusCode: 503, cause },
      );
    }
    throw new UpstreamError('The weather provider could not be reached.', {
      statusCode: 502,
      cause,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new UpstreamError(
      `The weather provider replied with status ${response.status}.`,
      {
        statusCode: 502,
      },
    );
  }

  const payload: unknown = await response.json().catch(() => null);
  const parsed = openMeteoResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new UpstreamError(
      'The weather provider returned data HeatShift could not use.',
      {
        statusCode: 502,
      },
    );
  }
  return toObservation(parsed.data);
}

function freshnessOf(entry: CacheEntry, now: number, cell: string, cached: boolean) {
  const freshness: WeatherFreshness = {
    provider: entry.observation.provider,
    fetchedAt: entry.fetchedAt,
    observedAt: entry.observation.observedAt,
    ageSeconds: Math.max(0, Math.round((now - Date.parse(entry.fetchedAt)) / 1000)),
    cacheTtlSeconds: WEATHER_CACHE_TTL_SECONDS,
    cached,
    cacheCell: cell,
    cacheScope: 'per-process',
  };
  return freshness;
}

export function createOpenMeteoProvider(
  fetchImpl: typeof fetch = globalThis.fetch,
): WeatherProvider {
  const cache = new WeatherCache();

  return {
    id: 'open-meteo',
    async lookup({ latitude, longitude }): Promise<WeatherLookup> {
      const cell = cacheCellOf(latitude, longitude);
      const now = Date.now();

      const hit = cache.read(cell, now);
      if (hit)
        return {
          observation: hit.observation,
          freshness: freshnessOf(hit, now, cell, true),
        };

      const observation = await cache.shared(cell, () =>
        fetchObservation(fetchImpl, latitude, longitude),
      );
      const entry: CacheEntry = {
        observation,
        fetchedAt: new Date(now).toISOString(),
        expiresAt: now + WEATHER_CACHE_TTL_SECONDS * 1000,
      };
      cache.write(cell, entry);

      return { observation, freshness: freshnessOf(entry, now, cell, false) };
    },
  };
}

export const openMeteoProvider = createOpenMeteoProvider();
