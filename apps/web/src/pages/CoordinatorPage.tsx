import { Card } from '../components/ui/card';
import { PageHeader } from '../components/layout/page-header';
import { ContentGrid, GridColumn } from '../components/layout/content-grid';
import { DemoNotice } from '../components/shared/demo-notice';
import { ErrorNote } from '../components/shared/error-note';
import { EmptyState } from '../components/shared/empty-state';
import { Skeleton } from '../components/ui/skeleton';
import {
  CoordinatorMetrics,
  LatestTaps,
  StatusDistribution,
} from '../features/coordinator/team-summary';
import { useCheckInSummary } from '../features/check-ins/use-check-ins';
import { useReliefPoints } from '../features/relief-points/use-relief-points';

const WINDOW_HOURS = 24;

/** Read-only team view for an MCD / NGO heat cell. No login yet. */
export function CoordinatorPage() {
  const summary = useCheckInSummary({ windowHours: WINDOW_HOURS });
  const relief = useReliefPoints({ limit: 200 });
  const verified = relief.points.filter((point) => point.verified).length;
  const data = summary.data;

  return (
    <ContentGrid>
      <GridColumn span={12}>
        <PageHeader
          eyebrow="Coordinator"
          title="Team heat cell"
          subtitle="Live check-ins from the demo rider group in Delhi NCR. Read-only: nothing here edits worker data."
        />
      </GridColumn>

      <GridColumn span={12}>
        {summary.loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : summary.error ? (
          <ErrorNote message={summary.error.message} onRetry={summary.reload} />
        ) : data ? (
          <CoordinatorMetrics data={data} />
        ) : null}
      </GridColumn>

      <GridColumn span={8} className="space-y-4 lg:space-y-6">
        {summary.loading ? (
          <Skeleton className="h-56" />
        ) : summary.error ? (
          <ErrorNote message={summary.error.message} onRetry={summary.reload} />
        ) : data ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
            <StatusDistribution data={data} />
            <LatestTaps data={data} />
          </div>
        ) : (
          <EmptyState title="No summary available yet." />
        )}
      </GridColumn>

      <GridColumn span={4} className="space-y-4 lg:space-y-6">
        <Card eyebrow="Network" title="Relief coverage" variant="quiet">
          {relief.error ? (
            <ErrorNote message={relief.error.message} onRetry={relief.reload} />
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Points', value: relief.points.length },
                  { label: 'Verified', value: verified },
                  { label: 'To verify', value: relief.points.length - verified },
                ].map((item) => (
                  <div key={item.label} className="stat-tile">
                    <dd className="text-2xl font-extrabold tabular">{item.value}</dd>
                    <dt className="eyebrow mt-1">{item.label}</dt>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs leading-snug text-ink-500">
                Unverified points need a field visit before they can be shown as trusted
                to workers.
              </p>
            </>
          )}
        </Card>

        <DemoNotice />
      </GridColumn>
    </ContentGrid>
  );
}
