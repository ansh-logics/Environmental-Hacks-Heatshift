import { Card } from '../components/ui/card';
import { PageHeader } from '../components/layout/page-header';
import { SectionHeading } from '../components/shared/section-heading';
import { DemoNotice } from '../components/shared/demo-notice';
import { ErrorNote } from '../components/shared/error-note';
import { TeamSummaryPanel } from '../features/coordinator/team-summary';
import { useReliefPoints } from '../features/relief-points/use-relief-points';

/** Read-only team view for an MCD / NGO heat cell. No login yet. */
export function CoordinatorPage() {
  const relief = useReliefPoints({ limit: 200 });
  const verified = relief.points.filter((point) => point.verified).length;

  return (
    <>
      <PageHeader
        title="Team heat cell"
        subtitle="Live check-ins from the demo rider group in Delhi NCR"
      />

      <TeamSummaryPanel />

      <div className="space-y-3">
        <SectionHeading title="Relief network coverage" />
        {relief.error ? (
          <ErrorNote message={relief.error.message} onRetry={relief.reload} />
        ) : (
          <Card>
            <dl className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Points', value: relief.points.length },
                { label: 'Verified', value: verified },
                { label: 'To verify', value: relief.points.length - verified },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-sand-100 py-3">
                  <dd className="text-2xl font-extrabold tabular">{item.value}</dd>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {item.label}
                  </dt>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-ink-500">
              Unverified points need a field visit before they can be shown as trusted to
              workers.
            </p>
          </Card>
        )}
      </div>

      <DemoNotice />
    </>
  );
}
