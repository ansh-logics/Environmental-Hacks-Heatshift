/**
 * App-level error for "a dependency we do not control let us down". The error
 * handler forwards `statusCode` and `code` so the browser sees
 * WEATHER_UNAVAILABLE / 502 / 503 rather than a generic INTERNAL_ERROR.
 */
export class UpstreamError extends Error {
  readonly statusCode: number;
  readonly code = 'WEATHER_UNAVAILABLE';

  constructor(message: string, options: { statusCode?: number; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = 'UpstreamError';
    this.statusCode = options.statusCode ?? 502;
  }
}
