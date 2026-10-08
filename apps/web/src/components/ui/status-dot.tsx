import { cn } from '../../lib/utils';
import type { ApiConnection } from '../../hooks/use-api-status';

const LABELS: Record<ApiConnection, string> = {
  checking: 'Checking',
  online: 'API connected',
  offline: 'API unreachable',
};

const COLORS: Record<ApiConnection, string> = {
  checking: 'bg-heat-moderate',
  online: 'bg-heat-low',
  offline: 'bg-heat-severe',
};

export function StatusDot({ connection }: { connection: ApiConnection }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700">
      <span className={cn('h-2.5 w-2.5 rounded-full', COLORS[connection])} aria-hidden />
      {LABELS[connection]}
    </span>
  );
}
