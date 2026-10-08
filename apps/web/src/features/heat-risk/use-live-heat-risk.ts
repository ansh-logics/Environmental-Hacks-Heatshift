import { useCallback, useState } from 'react';
import type { HeatRiskLiveRequest, HeatRiskLiveResult } from '@heatshift/shared';
import { api, ApiError } from '../../lib/api-client';

/**
 * One live plan request, kept separate from the manual preview hook so the
 * dashboard can show which of the two produced the plan on screen.
 */
export function useLiveHeatRisk() {
  const [result, setResult] = useState<HeatRiskLiveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runLive = useCallback(async (input: HeatRiskLiveRequest) => {
    setLoading(true);
    setError(null);
    try {
      setResult(await api.liveHeatRisk(input));
    } catch (cause) {
      // Keep the last good plan on screen: a failed refresh should not leave the
      // worker with nothing but an error, and the age label says how old it is.
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Live heat risk could not be calculated.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /** A manual run replaces the live plan, so the live state must go with it. */
  const clearLive = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, error, loading, runLive, clearLive };
}
