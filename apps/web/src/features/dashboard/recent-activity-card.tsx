import { Link } from 'react-router-dom';
import { CHECK_IN_STATUS_LABELS, ROUTES } from '@heatshift/shared';
import { Card } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/shared/empty-state';
import { useCheckInSummary } from '../check-ins/use-check-ins';
import { relativeTime } from '../../lib/utils';

/** Latest activity for this device's worker, straight from the check-in API. */
export function RecentActivityCard({ userId }: { userId: string }) {
  const { data, loading, error } = useCheckInSummary({ userId, windowHours: 24 });
  const latest = data?.latest[0];

  return (
    <Card eyebrow="Activity" title="Your last check-in" variant="quiet">
      {loading ? <Skeleton className="h-12" /> : null}

      {error ? (
        <p className="text-sm text-ink-500">
          Activity is unavailable while the API is unreachable.
        </p>
      ) : null}

      {!loading && !error && data ? (
        latest ? (
          <div>
            <p className="text-base font-bold text-ink-900">
              {CHECK_IN_STATUS_LABELS[latest.status]}
            </p>
            <p className="text-xs text-ink-500">
              {relativeTime(latest.createdAt)} - {data.inWindow} check-in
              {data.inWindow === 1 ? '' : 's'} from this device in the last{' '}
              {data.windowHours} h
            </p>
          </div>
        ) : (
          <EmptyState
            title="No check-ins yet."
            body="Tap a status below if you need water or a break."
          />
        )
      ) : null}

      <Link
        to={ROUTES.relief}
        className="mt-3 inline-flex min-h-8 text-sm font-semibold text-heat-accent-dark hover:underline"
      >
        Find water and shade nearby
      </Link>
    </Card>
  );
}
