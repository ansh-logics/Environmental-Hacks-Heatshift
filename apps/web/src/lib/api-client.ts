import {
  API_PREFIX,
  checkInSummaryResponseSchema,
  healthResponseSchema,
  heatRiskLiveRequestSchema,
  heatRiskLiveResponseSchema,
  heatRiskPreviewRequestSchema,
  heatRiskPreviewResponseSchema,
  reliefPointListResponseSchema,
  checkInCreateResponseSchema,
  weatherConditionsResponseSchema,
  type CheckInSummary,
  type CreateCheckInInput,
  type HeatRiskInput,
  type HeatRiskLiveRequest,
  type HeatRiskLiveResult,
  type HeatRiskResult,
  type HealthResponse,
  type ReliefPointType,
  type CheckIn,
} from '@heatshift/shared';
import { API_TIMEOUT_MS, LIVE_HEAT_RISK_TIMEOUT_MS, API_BASE_URL } from './constants';

export type ApiErrorReason = 'network' | 'timeout' | 'server' | 'contract';

/** One error type for the whole client so screens can render failures uniformly. */
export class ApiError extends Error {
  readonly reason: ApiErrorReason;
  readonly status?: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    options: {
      reason: ApiErrorReason;
      status?: number;
      code?: string;
      details?: unknown;
    },
  ) {
    super(message);
    this.name = 'ApiError';
    this.reason = options.reason;
    this.status = options.status;
    this.code = options.code ?? options.reason.toUpperCase();
    this.details = options.details;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  /** Milliseconds; the API is called on mobile data, so fail visibly and fast. */
  timeoutMs?: number;
};

async function request<T>(
  path: string,
  schema: { parse: (value: unknown) => T },
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: options.body === undefined ? {} : { 'content-type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      credentials: 'omit',
    });
  } catch {
    clearTimeout(timer);
    const timedOut = controller.signal.aborted;
    throw new ApiError(
      timedOut
        ? `No response from the HeatShift API within ${API_TIMEOUT_MS / 1000}s.`
        : 'Could not reach the HeatShift API. Check your connection.',
      {
        reason: timedOut ? 'timeout' : 'network',
        code: timedOut ? 'TIMEOUT' : 'NETWORK',
      },
    );
  }

  clearTimeout(timer);

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const envelope = (
      payload as { error?: { code?: string; message?: string; details?: unknown } }
    )?.error;
    throw new ApiError(
      envelope?.message ?? `Request failed with status ${response.status}`,
      {
        reason: 'server',
        status: response.status,
        code: envelope?.code ?? 'REQUEST_FAILED',
        details: envelope?.details,
      },
    );
  }

  try {
    return schema.parse(payload);
  } catch (error) {
    throw new ApiError('The API response did not match the shared contract.', {
      reason: 'contract',
      status: response.status,
      code: 'CONTRACT_MISMATCH',
      details: error instanceof Error ? error.message : undefined,
    });
  }
}

function queryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export const api = {
  baseUrl: API_BASE_URL,

  getHealth(): Promise<HealthResponse> {
    return request('/health', healthResponseSchema, { timeoutMs: 5000 });
  },

  listReliefPoints(
    params: {
      type?: ReliefPointType;
      verifiedOnly?: boolean;
      limit?: number;
      latitude?: number;
      longitude?: number;
    } = {},
  ) {
    const suffix = queryString({
      type: params.type,
      verifiedOnly: params.verifiedOnly ? 'true' : undefined,
      limit: params.limit,
      // Sent as a pair or not at all; the API rejects half a coordinate.
      latitude: params.latitude,
      longitude: params.longitude,
    });
    return request(`${API_PREFIX}/relief-points${suffix}`, reliefPointListResponseSchema);
  },

  createCheckIn(input: CreateCheckInInput): Promise<{ data: CheckIn }> {
    return request(`${API_PREFIX}/check-ins`, checkInCreateResponseSchema, {
      method: 'POST',
      body: input,
    });
  },

  getCheckInSummary(
    params: { userId?: string; windowHours?: number } = {},
  ): Promise<CheckInSummary> {
    const suffix = queryString({
      userId: params.userId,
      windowHours: params.windowHours,
    });
    return request(
      `${API_PREFIX}/check-ins/summary${suffix}`,
      checkInSummaryResponseSchema,
    );
  },

  previewHeatRisk(input: HeatRiskInput): Promise<HeatRiskResult> {
    // Parse locally too: a bad form state should fail here, not in the response.
    const valid = heatRiskPreviewRequestSchema.parse(input);
    return request(`${API_PREFIX}/heat-risk/preview`, heatRiskPreviewResponseSchema, {
      method: 'POST',
      body: valid,
    }).then((response) => response.data);
  },

  /**
   * Live plan from a position the worker agreed to share. Slower than the other
   * calls because the API waits on the weather provider for us.
   */
  liveHeatRisk(input: HeatRiskLiveRequest): Promise<HeatRiskLiveResult> {
    const valid = heatRiskLiveRequestSchema.parse(input);
    return request(`${API_PREFIX}/heat-risk/live`, heatRiskLiveResponseSchema, {
      method: 'POST',
      body: valid,
      timeoutMs: LIVE_HEAT_RISK_TIMEOUT_MS,
    }).then((response) => response.data);
  },

  getWeatherConditions(coordinate: { latitude: number; longitude: number }) {
    const suffix = queryString(coordinate);
    return request(
      `${API_PREFIX}/weather/conditions${suffix}`,
      weatherConditionsResponseSchema,
      { timeoutMs: LIVE_HEAT_RISK_TIMEOUT_MS },
    ).then((response) => response.data);
  },
};
