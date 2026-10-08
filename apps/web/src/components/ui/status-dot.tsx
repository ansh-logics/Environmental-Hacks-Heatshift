import { cn } from '../../lib/utils';
import type { ApiConnection } from '../../hooks/use-api-status';

const LABELS: Record<ApiConnection, string> = {
  checking: 'Checking',
  online: 'API connected',
  offline: 'API unreachable',
};

/** Green = reachable, amber = still probing, red = offline. */
const COLORS: Record<ApiConnection, string> = {
  checking: 'bg-heat-moderate',
  online: 'bg-heat-low',
  offline: 'bg-heat-severe',
};

export function StatusDot({
  connection,
  className,
}: {
  connection: ApiConnection;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-block h-2.5 w-2.5 shrink-0 rounded-full',
        COLORS[connection],
        className,
      )}
      aria-hidden
    />
  );
}

/**
 * The quiet, always-visible connection indicator used in the tablet header and
 * the desktop sidebar. Detailed diagnostics live behind a disclosure elsewhere.
 */
export function ConnectionStatus({
  connection,
  compact = false,
  className,
}: {
  connection: ApiConnection;
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        <StatusDot connection={connection} />
        <span className="sr-only">{LABELS[connection]}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-xs font-semibold',
        connection === 'offline' ? 'text-heat-severe' : 'text-ink-700',
        className,
      )}
    >
      <StatusDot connection={connection} />
      {LABELS[connection]}
    </span>
  );
}

export { LABELS as CONNECTION_LABELS };
