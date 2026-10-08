import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiError } from '../lib/api-client';

export type AsyncState<T> = {
  data: T | null;
  error: ApiError | Error | null;
  loading: boolean;
  reload: () => void;
};

/**
 * Minimal data-fetching state machine. React Query is the obvious next step once
 * there are more screens; for four endpoints this keeps the bundle small.
 */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AsyncState<T>['error']>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    load()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setError(cause instanceof Error ? cause : new Error(String(cause)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data, error, loading, reload };
}
