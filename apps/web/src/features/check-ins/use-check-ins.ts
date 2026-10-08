import { useCallback, useState } from 'react';
import type { CheckIn, CheckInStatus } from '@heatshift/shared';
import { api, ApiError } from '../../lib/api-client';
import { useAppState } from '../../app/providers';
import { useAsync } from '../../hooks/use-async';

export function useCheckInSummary(
  params: { userId?: string; windowHours?: number } = {},
) {
  return useAsync(
    () => api.getCheckInSummary(params),
    [params.userId, params.windowHours],
  );
}

export function useCheckInPosting() {
  const { identity } = useAppState();
  const [pending, setPending] = useState<CheckInStatus | null>(null);
  const [lastPosted, setLastPosted] = useState<CheckIn | null>(null);
  const [error, setError] = useState<string | null>(null);

  const post = useCallback(
    async (status: CheckInStatus, coords?: { lat: number; lng: number }) => {
      setPending(status);
      setError(null);
      try {
        const response = await api.createCheckIn({
          userId: identity.userId,
          status,
          latitude: coords?.lat,
          longitude: coords?.lng,
        });
        setLastPosted(response.data);
        return response.data;
      } catch (cause) {
        setError(
          cause instanceof ApiError
            ? cause.message
            : 'Could not send your check-in. Try again.',
        );
        return null;
      } finally {
        setPending(null);
      }
    },
    [identity.userId],
  );

  return { post, pending, lastPosted, error };
}
