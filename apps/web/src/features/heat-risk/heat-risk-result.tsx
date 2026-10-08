import type { HeatLevel, HeatRiskResult } from '@heatshift/shared';
import { Badge, type BadgeTone } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { StatTile } from '../../components/ui/stat';
import { DemoNotice } from '../../components/shared/demo-notice';
import { Disclosure } from '../../components/motion/collapsible-content';
import { Reveal } from '../../components/motion/reveal';
import { useCountUp } from '../../components/motion/use-count-up';
import { IconInfo } from '../../components/ui/icons';
import { Skeleton } from '../../components/ui/skeleton';
import { formatClockHour } from '../../lib/utils';

const TONE_BY_LEVEL: Record<HeatLevel, BadgeTone> = {
  low: 'low',
  moderate: 'moderate',
  high: 'high',
  severe: 'severe',
};

const COLOUR_BY_LEVEL: Record<HeatLevel, string> = {
  low: 'text-heat-low',
  moderate: 'text-heat-moderate',
  high: 'text-heat-high',
  severe: 'text-heat-severe',
};

const RING_RADIUS = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * The 0-100 score. The arc and the digits are driven by the same count-up, so
 * they always agree, and the final server value is what assistive tech reads.
 */
function ScoreRing({ score, level }: { score: number; level: HeatLevel }) {
  const display = useCountUp(score, { from: 0, duration: 0.5 });
  const progress = Math.min(100, Math.max(0, display)) / 100;

  return (
    <div className={`relative h-20 w-20 shrink-0 ${COLOUR_BY_LEVEL[level]}`}>
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90" aria-hidden="true">
        <circle
          cx="40"
          cy="40"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.16"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold leading-none tabular" aria-hidden>
          {Math.round(display)}
        </span>
        <span className="text-[0.65rem] font-bold uppercase tracking-wide" aria-hidden>
          / 100
        </span>
        <span className="sr-only">Heat risk score {score} out of 100</span>
      </div>
    </div>
  );
}

export function HeatRiskEmptyCard() {
  return (
    <Card eyebrow="Step 3" title="Your plan will appear here">
      <div className="flex items-start gap-3">
        <IconInfo size={20} className="mt-0.5 shrink-0 text-ink-400" />
        <p className="text-sm text-ink-500">
          Nothing has been calculated yet. Set the weather above and run the check -
          HeatShift will return a work/rest cycle, a water target and the hours to avoid
          for your exact shift.
        </p>
      </div>
    </Card>
  );
}

export function HeatRiskLoadingCard() {
  return (
    <Card eyebrow="Step 3" title="Calculating your plan">
      <Skeleton className="h-20" />
      <Skeleton className="mt-3 h-16" />
    </Card>
  );
}

/**
 * Mounts when a real result arrives, so the entrance plays exactly once per
 * plan - editing a field or re-running never replays it.
 */
export function HeatRiskResultCard({ result }: { result: HeatRiskResult }) {
  const { plan } = result;

  return (
    <Reveal>
      <Card eyebrow="Step 3" title="Follow this plan">
        <div className="flex items-center gap-4">
          <ScoreRing score={result.score} level={result.level} />
          <div className="min-w-0">
            <Badge tone={TONE_BY_LEVEL[result.level]}>{result.label}</Badge>
            <p className="mt-1.5 text-base font-semibold leading-snug text-ink-900">
              {result.headline}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              Heat strain index {result.wbgtC} °C (WBGT)
            </p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Work / cycle"
            value={`${plan.workMinutesPerCycle} min`}
            hint="Then rest"
          />
          <StatTile
            label="Rest / cycle"
            value={`${plan.restMinutesPerCycle} min`}
            hint="In shade"
          />
          <StatTile
            label="Water / hour"
            value={`${(plan.waterMlPerHour / 1000).toFixed(1)} L`}
            hint="Sip steadily"
          />
          <StatTile
            label="Max shift"
            value={`${(plan.maxRecommendedShiftMinutes / 60).toFixed(1)} h`}
            hint={`Avoid after ${formatClockHour(plan.unsafeStartHour)}`}
          />
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

        <Disclosure
          label="Why this score"
          chevronSize={16}
          className="mt-4 rounded-xl border border-sand-200 px-3 py-2"
          triggerClassName="flex min-h-8 w-full items-center gap-1.5 text-left text-sm font-semibold text-ink-700"
        >
          <ul className="space-y-1.5 text-xs text-ink-500">
            {result.factors.map((factor) => (
              <li key={factor.factor}>
                <span className="font-semibold text-ink-700">{factor.factor}:</span>{' '}
                {factor.impact}
              </li>
            ))}
          </ul>
        </Disclosure>

        <DemoNotice className="mt-3" />
      </Card>
    </Reveal>
  );
}
