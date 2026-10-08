import { CHECK_IN_STATUS_LABELS } from '@heatshift/shared';
import { Card } from '../../components/ui/card';
import { ErrorNote } from '../../components/shared/error-note';
import { IconAlert, IconCheck, IconDrop, IconShade } from '../../components/ui/icons';
import { CHECK_IN_BUTTONS } from '../../lib/constants';
import { relativeTime } from '../../lib/utils';
import { useCheckInPosting } from './use-check-ins';

const ICONS = { check: IconCheck, drop: IconDrop, shade: IconShade, alert: IconAlert };

const TONE_CLASSES = {
  neutral: 'border-heat-low/40 text-heat-low',
  moderate: 'border-heat-moderate/40 text-heat-moderate',
  high: 'border-heat-high/40 text-heat-high',
  severe: 'border-heat-severe/40 text-heat-severe',
} as const;

/** Step 4: one tap tells the team something is wrong. */
export function CheckInBar({ coords }: { coords?: { lat: number; lng: number } }) {
  const { post, pending, lastPosted, error } = useCheckInPosting();

  return (
    <Card eyebrow="Step 4" title="How are you right now?">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {CHECK_IN_BUTTONS.map((button) => {
          const Icon = ICONS[button.icon];
          return (
            <button
              key={button.status}
              type="button"
              className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 bg-white px-2 py-3 text-sm font-bold transition-colors hover:bg-sand-100 active:scale-[0.98] disabled:opacity-60 ${TONE_CLASSES[button.tone]}`}
              onClick={() => void post(button.status, coords)}
              disabled={pending !== null}
            >
              <Icon size={26} />
              {CHECK_IN_STATUS_LABELS[button.status]}
            </button>
          );
        })}
      </div>

      <p className="mt-3 min-h-5 text-xs text-ink-500" role="status">
        {pending
          ? `Sending "${CHECK_IN_STATUS_LABELS[pending]}"...`
          : lastPosted
            ? `Sent "${CHECK_IN_STATUS_LABELS[lastPosted.status]}" ${relativeTime(lastPosted.createdAt)}.`
            : 'Check-ins help your coordinator move water and shade to where riders actually are.'}
      </p>

      {error ? <ErrorNote message={error} /> : null}
    </Card>
  );
}
