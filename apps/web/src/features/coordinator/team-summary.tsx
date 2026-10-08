import { Link } from 'react-router-dom';
import {
  CHECK_IN_STATUS_LABELS,
  ROUTES,
  type CheckInStatus,
  type CheckInSummary,
} from '@heatshift/shared';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { StatCard } from '../../components/ui/stat';
import { EmptyState } from '../../components/shared/empty-state';
import {
  IconClock,
  IconDrop,
  IconPeople,
  IconAlert,
  IconCheck,
} from '../../components/ui/icons';
import { relativeTime } from '../../lib/utils';

const ORDER: CheckInStatus[] = ['unwell', 'need_water', 'need_break', 'okay'];

const BAR_COLOUR: Record<CheckInStatus, string> = {
  okay: 'bg-heat-low',
  need_water: 'bg-heat-moderate',
  need_break: 'bg-heat-high',
  unwell: 'bg-heat-severe',
};

/** Headline numbers a coordinator reads first. Every value comes from /check-ins/summary. */
export function CoordinatorMetrics({ data }: { data: CheckInSummary }) {
  const flagged =
    data.byStatus.unwell + data.byStatus.need_water + data.byStatus.need_break;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
      <StatCard
        label={`Check-ins / ${data.windowHours} h`}
        value={data.inWindow}
        hint={`${data.total} recorded in total`}
        icon={<IconClock size={18} />}
      />
      <StatCard
        label="Workers reporting"
        value={data.uniqueWorkers}
        hint="Distinct check-in ids in this window"
        icon={<IconPeople size={18} />}
      />
      <StatCard
        label="Flagged for help"
        value={flagged}
        hint="Need water, need break or unwell"
        tone={flagged > 0 ? 'moderate' : 'low'}
        icon={<IconDrop size={18} />}
      />
      <StatCard
        label="Unwell"
        value={data.byStatus.unwell}
        hint={
          data.byStatus.unwell > 0
            ? 'Escalate to a clinic call'
            : 'Nobody reported unwell'
        }
        tone={data.byStatus.unwell > 0 ? 'severe' : 'low'}
        icon={
          data.byStatus.unwell > 0 ? <IconAlert size={18} /> : <IconCheck size={18} />
        }
      />
    </div>
  );
}

/** Status distribution across the window, drawn from the same summary payload. */
export function StatusDistribution({ data }: { data: CheckInSummary }) {
  const max = Math.max(1, ...ORDER.map((status) => data.byStatus[status]));

  return (
    <Card eyebrow="Distribution" title="Check-ins by status">
      <ul className="space-y-3">
        {ORDER.map((status) => (
          <li key={status} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-xs font-semibold text-ink-700 sm:w-36">
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
      <p className="mt-3 text-xs text-ink-500">
        Bars are relative to the most common status in this window.
      </p>
    </Card>
  );
}

export function LatestTaps({ data }: { data: CheckInSummary }) {
  return (
    <Card eyebrow="Timeline" title="Latest taps">
      {data.latest.length === 0 ? (
        <EmptyState title="No check-ins posted yet." />
      ) : (
        <ul className="space-y-2">
          {data.latest.slice(0, 8).map((checkIn) => (
            <li
              key={checkIn.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-sand-200 bg-white px-3 py-2.5"
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
      <Link
        to={ROUTES.relief}
        className="mt-3 inline-flex min-h-8 text-sm font-semibold text-heat-accent-dark hover:underline"
      >
        Open the relief network
      </Link>
    </Card>
  );
}
