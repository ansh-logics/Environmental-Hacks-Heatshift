import { Card } from '../components/ui/card';
import { ContentGrid, GridColumn } from '../components/layout/content-grid';
import { ErrorNote } from '../components/shared/error-note';
import { ConnectionPanel } from '../components/shared/connection-panel';
import { OnboardingPanel } from '../features/onboarding/onboarding-panel';
import { HeatRiskPanel } from '../features/heat-risk/heat-risk-panel';
import {
  HeatRiskEmptyCard,
  HeatRiskLoadingCard,
  HeatRiskResultCard,
} from '../features/heat-risk/heat-risk-result';
import { useShiftCheck } from '../features/heat-risk/use-shift-check';
import { ShiftHero } from '../features/dashboard/shift-hero';
import { ShiftSnapshotCard } from '../features/dashboard/shift-snapshot-card';
import { SafetyCard } from '../features/dashboard/safety-card';
import { RecentActivityCard } from '../features/dashboard/recent-activity-card';
import { CheckInBar } from '../features/check-ins/check-in-bar';
import { ReliefPointList } from '../features/relief-points/relief-point-list';
import { useReliefPoints } from '../features/relief-points/use-relief-points';
import { useAppState } from '../app/providers';
import { useLocation } from '../hooks/use-location';

/**
 * Worker journey, one column on phones and 8/4 on desktop:
 * 1 set your shift, 2 check the heat, 3 follow the plan, 4 check in.
 */
export function WorkerDashboardPage() {
  const { profile, identity } = useAppState();
  const location = useLocation();
  const relief = useReliefPoints({ limit: 3 });
  const shift = useShiftCheck(profile);

  return (
    <>
      <ShiftHero
        name={identity.name.split(' ')[0] ?? identity.name}
        profile={profile}
        sunExposure={shift.sunExposure}
        result={shift.result}
        loading={shift.loading}
        onCheck={() => void shift.run()}
      />

      <ContentGrid>
        <GridColumn span={8} className="space-y-4 lg:space-y-6">
          <OnboardingPanel />

          <HeatRiskPanel
            profile={profile}
            weather={shift.weather}
            sunExposure={shift.sunExposure}
            activePreset={shift.activePreset}
            loading={shift.loading}
            onWeatherChange={shift.setWeather}
            onPreset={shift.applyPreset}
            onRun={() => void shift.run()}
          />

          {shift.error ? <ErrorNote message={shift.error} /> : null}
          {shift.loading ? (
            <HeatRiskLoadingCard />
          ) : shift.result ? (
            <HeatRiskResultCard result={shift.result} />
          ) : (
            <HeatRiskEmptyCard />
          )}

          <CheckInBar
            coords={location.source === 'device' ? location.coords : undefined}
          />
        </GridColumn>

        <GridColumn span={4} className="space-y-4 lg:space-y-6">
          <ShiftSnapshotCard
            profile={profile}
            sunExposure={shift.sunExposure}
            locationLabel={location.label}
            weather={shift.weather}
          />
          <SafetyCard profile={profile} result={shift.result} />
          <RecentActivityCard userId={identity.userId} />

          <Card eyebrow="Nearby" title="Relief on your route">
            {relief.error ? (
              <ErrorNote message={relief.error.message} onRetry={relief.reload} />
            ) : (
              <ReliefPointList
                points={relief.points}
                origin={location.coords}
                loading={relief.loading}
                limit={3}
                emptyMessage="No seeded relief points near this location yet."
              />
            )}
          </Card>

          <ConnectionPanel />
        </GridColumn>
      </ContentGrid>
    </>
  );
}
