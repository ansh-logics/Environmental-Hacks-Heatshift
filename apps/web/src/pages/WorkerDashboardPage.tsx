import { WORK_TYPE_LABELS } from '@heatshift/shared';
import { ApiStatusCard } from '../components/shared/api-status-card';
import { Card } from '../components/ui/card';
import { PageHeader } from '../components/layout/page-header';
import { SectionHeading } from '../components/shared/section-heading';
import { ErrorNote } from '../components/shared/error-note';
import { OnboardingPanel } from '../features/onboarding/onboarding-panel';
import { HeatRiskPanel } from '../features/heat-risk/heat-risk-panel';
import { CheckInBar } from '../features/check-ins/check-in-bar';
import { ReliefPointList } from '../features/relief-points/relief-point-list';
import { useReliefPoints } from '../features/relief-points/use-relief-points';
import { useAppState } from '../app/providers';
import { useLocation } from '../hooks/use-location';

export function WorkerDashboardPage() {
  const { profile, identity } = useAppState();
  const location = useLocation();
  const relief = useReliefPoints({ limit: 3 });

  return (
    <>
      <PageHeader
        title={`Hello, ${identity.name.split(' ')[0]}`}
        subtitle={`${WORK_TYPE_LABELS[profile.workType]} - ${profile.city} - ${profile.hoursInShift} h planned today`}
      />

      <ApiStatusCard />
      <OnboardingPanel />
      <HeatRiskPanel />
      <CheckInBar coords={location.source === 'device' ? location.coords : undefined} />

      <div className="space-y-3">
        <SectionHeading
          title="Relief on your route"
          description="Closest three from the demo dataset"
        />
        {relief.error ? (
          <ErrorNote message={relief.error.message} onRetry={relief.reload} />
        ) : (
          <Card>
            <ReliefPointList
              points={relief.points}
              origin={location.coords}
              loading={relief.loading}
              emptyMessage="No seeded relief points near this location yet."
            />
          </Card>
        )}
      </div>
    </>
  );
}
