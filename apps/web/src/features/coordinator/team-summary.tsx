import { CHECK_IN_STATUS_LABELS, type CheckInStatus } from '@heatshift/shared';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/shared/empty-state';
import { ErrorNote } from '../../components/shared/error-note';
import { Skeleton } from '../../components/ui/skeleton';
import { relativeTime } from '../../lib/utils';
import { useCheckInSummary } from '../check-ins/use-check-ins';

const ORDER: CheckInStatus[] = ['unwell', 'need_water', 'need_break', 'okay'];
const BAR_COLOUR: Record<CheckInStatus, string> = {
  okay: 'bg-heat-low',
  need_water: 'bg-heat-moderate',
  need_break: 'bg-heat-high',
  unwell: 'bg-heat-severe',
};

/** Coordinator read-only view of the team's last 24 hours of check-ins. */
export function TeamSummaryPanel({ windowHours = 24 }: { windowHours?: number }) {
  const { data, error, loading, reload } = useCheckInSummary({ windowHours });

  if (loading) return <Skeleton className="h-56" />;
  if (error) return <ErrorNote message={error.message} onRetry={reload} />;
  if (!data) return <EmptyState title="No summary available yet." />;

  const max = Math.max(1, ...ORDER.map((status) => data.byStatus[status]));

  return (
    <Card
      eyebrow="Team"
      title={`${data.inWindow} check-ins in the last ${data.windowHours} h`}
    >
      <p className="text-sm text-ink-500">
        {data.total} total from {data.uniqueWorkers} workers on this demo team.
      </p>

      <ul className="mt-4 space-y-2">
        {ORDER.map((status) => (
          <li key={status} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs font-semibold text-ink-700">
              {CHECK_IN_STATUS_LABELS[status]}
            </span>
            <span className="h-3 flex-1 overflow-hidden rounded-full bg-sand-200">
              <span
                className={`block h-full rounded-full ${BAR_COLOUR[status]}`}
                style={{ width: `${(data.byStatus[status] / max) * 100}%` }}
              />
            </span>
            <span className="w-6 shrink-0 text-right text-sm font-bold tabular">
              {data.byStatus[status]}
            </span>
          </li>
        ))}
      </ul>

      <h3 className="mt-5 text-sm font-bold">Latest taps</h3>
      {data.latest.length === 0 ? (
        <EmptyState title="No check-ins posted yet." className="mt-2" />
      ) : (
        <ul className="mt-2 space-y-2">
          {data.latest.slice(0, 6).map((checkIn) => (
            <li
              key={checkIn.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-sand-300 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {CHECK_IN_STATUS_LABELS[checkIn.status]}
                </p>
                <p className="text-xs text-ink-500">
                  Worker {checkIn.userId.slice(-4)} - {relativeTime(checkIn.createdAt)}
                </p>
              </div>
              <Badge tone={checkIn.latitude ? 'low' : 'info'}>
                {checkIn.latitude ? 'with location' : 'no location'}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
