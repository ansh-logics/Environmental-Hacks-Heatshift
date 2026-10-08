import { useCallback, useState } from 'react';
import type { HeatRiskInput, HeatRiskResult } from '@heatshift/shared';
import { api, ApiError } from '../../lib/api-client';

export function useHeatRiskPreview() {
  const [result, setResult] = useState<HeatRiskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const preview = useCallback(async (input: HeatRiskInput) => {
    setLoading(true);
    setError(null);
    try {
      setResult(await api.previewHeatRisk(input));
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : 'Could not calculate heat risk.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, error, loading, preview };
}
