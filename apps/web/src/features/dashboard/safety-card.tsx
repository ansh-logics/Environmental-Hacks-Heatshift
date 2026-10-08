import type { HeatRiskResult } from '@heatshift/shared';
import { Card } from '../../components/ui/card';
import { IconShield } from '../../components/ui/icons';
import { formatClockHour } from '../../lib/utils';
import type { WorkerProfileDraft } from '../onboarding/profile';

/**
 * Tips are derived only from what the worker actually entered and from a
 * calculated plan - nothing here is invented filler.
 */
export function SafetyCard({
  profile,
  result,
}: {
  profile: WorkerProfileDraft;
  result: HeatRiskResult | null;
}) {
  const tips: string[] = [];

  if (result) {
    tips.push(
      `Work ${result.plan.workMinutesPerCycle} min, rest ${result.plan.restMinutesPerCycle} min, every cycle.`,
      `Do not start a shift after ${formatClockHour(result.plan.unsafeStartHour)} in these conditions.`,
    );
  }
  if (profile.shadeAccess === 'none') {
    tips.push('No shade on this route: pick a rest point before you leave.');
  }
  if (profile.waterAccess === 'none') {
    tips.push('Carry your own water - this route has no reliable supply.');
  }
  if (!profile.acclimatized) {
    tips.push('New to this heat? Take longer rests and build up over 1-2 weeks.');
  }
  if (tips.length === 0) {
    tips.push('Re-check after midday - heat risk changes through the shift.');
  }

  return (
    <Card eyebrow="Guidance" title="Safety rules" variant="quiet">
      <ul className="space-y-2">
        {tips.slice(0, 4).map((tip) => (
          <li key={tip} className="flex gap-2 text-sm text-ink-700">
            <IconShield size={18} className="mt-0.5 shrink-0 text-heat-low" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
