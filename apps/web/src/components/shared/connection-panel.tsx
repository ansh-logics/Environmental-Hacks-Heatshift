import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { IconChevron, IconRefresh } from '../ui/icons';
import { ConnectionStatus } from '../ui/status-dot';
import { useConnection } from '../../app/providers';
import { API_BASE_URL } from '../../lib/constants';

/**
 * The backend proof the dashboard has to give — kept deliberately quiet: a
 * status line at the top, full diagnostics behind a disclosure.
 */
export function ConnectionPanel() {
  const { connection, health, lastCheckedAt, refresh } = useConnection();

  return (
    <Card
      variant="quiet"
      eyebrow="Connection"
      title={
        <span className="flex items-center gap-2">
          <ConnectionStatus connection={connection} compact />
          <span className="text-ink-900">
            {connection === 'online'
              ? 'API connected'
              : connection === 'offline'
                ? 'API unreachable'
                : 'Checking the API'}
          </span>
        </span>
      }
      action={
        <Button
          variant="quiet"
          size="sm"
          onClick={refresh}
          aria-label="Re-check API connection"
        >
          <IconRefresh size={16} />
          Re-check
        </Button>
      }
    >
      {connection === 'online' && health ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="low">Database up</Badge>
          <Badge tone="neutral">v{health.version}</Badge>
          <Badge tone="neutral">{health.environment}</Badge>
        </div>
      ) : null}

      {connection === 'offline' ? (
        <p className="text-xs leading-snug text-ink-700">
          Start the backend with <code>docker compose up --build</code> or{' '}
          <code>pnpm dev:api</code>. Saved answers still work on this phone.
        </p>
      ) : null}

      <details className="group mt-3">
        <summary className="flex min-h-8 cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-900">
          <IconChevron size={14} className="transition-transform group-open:rotate-180" />
          Diagnostics
        </summary>
        <dl className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-white p-3 text-xs text-ink-500">
          <div className="col-span-2 min-w-0">
            <dt className="font-semibold text-ink-700">Endpoint</dt>
            <dd className="break-all">{`${API_BASE_URL}/health`}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink-700">Last checked</dt>
            <dd>
              {lastCheckedAt ? new Date(lastCheckedAt).toLocaleTimeString() : 'not yet'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink-700">Database</dt>
            <dd>{health?.database ?? 'unknown'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink-700">Uptime</dt>
            <dd>{health ? `${Math.round(health.uptimeSeconds)}s` : '-'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink-700">Service</dt>
            <dd>{health ? `${health.service} ${health.version}` : '-'}</dd>
          </div>
        </dl>
      </details>
    </Card>
  );
}
