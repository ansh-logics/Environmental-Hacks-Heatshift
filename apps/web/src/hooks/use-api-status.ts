import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HealthResponse } from '@heatshift/shared';
import { api } from '../lib/api-client';
import { HEALTH_POLL_MS } from '../lib/constants';

export type ApiConnection = 'checking' | 'online' | 'offline';

export type ApiStatus = {
  connection: ApiConnection;
  health: HealthResponse | null;
  lastCheckedAt: string | null;
  refresh: () => void;
};

/** Polls GET /health so the shell can always state whether it has a backend. */
export function useApiStatus(): ApiStatus {
  const [connection, setConnection] = useState<ApiConnection>('checking');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const result = await api.getHealth();
        if (cancelled) return;
        setHealth(result);
        setConnection(result.database === 'up' ? 'online' : 'checking');
      } catch {
        if (cancelled) return;
        setHealth(null);
        setConnection('offline');
      } finally {
        if (!cancelled) setLastCheckedAt(new Date().toISOString());
      }
    };

    void check();
    const timer = setInterval(check, HEALTH_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [nonce]);

  return useMemo(
    () => ({ connection, health, lastCheckedAt, refresh }),
    [connection, health, lastCheckedAt, refresh],
  );
}
