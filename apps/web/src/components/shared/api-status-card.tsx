import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { IconRefresh } from '../ui/icons';
import { StatusDot } from '../ui/status-dot';
import { useApiStatus } from '../../hooks/use-api-status';
import { API_BASE_URL } from '../../lib/constants';

/**
 * Requirement from the foundation spec: the dashboard must visibly prove it can
 * reach the API, and say so plainly when it cannot.
 */
export function ApiStatusCard() {
  const { connection, health, lastCheckedAt, refresh } = useApiStatus();

  return (
    <Card
      eyebrow="Connection"
      title={
        connection === 'online'
          ? 'API connected'
          : connection === 'offline'
            ? 'API unreachable'
            : 'Checking the API'
      }
      action={
        <Button variant="ghost" onClick={refresh} aria-label="Re-check API connection">
          <IconRefresh size={18} />
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusDot connection={connection} />
        {health ? (
          <>
            <Badge tone={health.database === 'up' ? 'low' : 'severe'}>
              database {health.database}
            </Badge>
            <Badge tone="info">v{health.version}</Badge>
          </>
        ) : null}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-500">
        <div>
          <dt className="font-semibold text-ink-700">Endpoint</dt>
          <dd className="break-all">{`${API_BASE_URL}/health`}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink-700">Last checked</dt>
          <dd>
            {lastCheckedAt ? new Date(lastCheckedAt).toLocaleTimeString() : 'not yet'}
          </dd>
        </div>
        {health ? (
          <div>
            <dt className="font-semibold text-ink-700">Uptime</dt>
            <dd>{Math.round(health.uptimeSeconds)}s</dd>
          </div>
        ) : null}
      </dl>

      {connection === 'offline' ? (
        <p className="mt-3 rounded-xl bg-heat-severe/5 px-3 py-2 text-xs text-ink-700">
          Start the backend with <code>docker compose up --build</code> or{' '}
          <code>pnpm dev:api</code>. Saved answers still work on this phone.
        </p>
      ) : null}
    </Card>
  );
}
