import type { HeatLevel, HeatRiskResult } from '@heatshift/shared';
import { Badge, type BadgeTone } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { DemoNotice } from '../../components/shared/demo-notice';
import { formatClockHour } from '../../lib/utils';

const TONE_BY_LEVEL: Record<HeatLevel, BadgeTone> = {
  low: 'low',
  moderate: 'moderate',
  high: 'high',
  severe: 'severe',
};

const RING_BY_LEVEL: Record<HeatLevel, string> = {
  low: 'text-heat-low',
  moderate: 'text-heat-moderate',
  high: 'text-heat-high',
  severe: 'text-heat-severe',
};

export function HeatRiskResultCard({ result }: { result: HeatRiskResult }) {
  const tone = TONE_BY_LEVEL[result.level];
  const { plan } = result;

  return (
    <Card eyebrow="Step 2" title="Your heat plan">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border-4 border-current ${RING_BY_LEVEL[result.level]}`}
        >
          <span className="text-3xl font-extrabold tabular leading-none">
            {result.score}
          </span>
          <span className="text-[0.65rem] font-bold uppercase tracking-wide">/ 100</span>
        </div>
        <div className="min-w-0">
          <Badge tone={tone}>{result.label}</Badge>
          <p className="mt-1 text-sm font-semibold text-ink-900">{result.headline}</p>
          <p className="text-xs text-ink-500">
            Heat strain index {result.wbgtC} °C (WBGT)
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {[
          { label: 'Work per break cycle', value: `${plan.workMinutesPerCycle} min` },
          { label: 'Rest in shade', value: `${plan.restMinutesPerCycle} min` },
          {
            label: 'Water per hour',
            value: `${(plan.waterMlPerHour / 1000).toFixed(1)} L`,
          },
          {
            label: 'Max shift now',
            value: `${(plan.maxRecommendedShiftMinutes / 60).toFixed(1)} h`,
          },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-sand-100 p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              {item.label}
            </dt>
            <dd className="mt-0.5 text-lg font-bold tabular text-ink-900">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <ul className="mt-4 space-y-2">
        {plan.advice.map((line) => (
          <li key={line} className="flex gap-2 text-sm text-ink-700">
            <span
              aria-hidden
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-heat-accent"
            />
            {line}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-ink-500">
        Risky window starts {formatClockHour(plan.unsafeStartHour)}.
      </p>

      <details className="mt-3 rounded-xl border border-sand-300 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-ink-700">
          Why this score
        </summary>
        <ul className="mt-2 space-y-1.5 text-xs text-ink-500">
          {result.factors.map((factor) => (
            <li key={factor.factor}>
              <span className="font-semibold text-ink-700">{factor.factor}:</span>{' '}
              {factor.impact}
            </li>
          ))}
        </ul>
      </details>

      <DemoNotice className="mt-3" />
    </Card>
  );
}
