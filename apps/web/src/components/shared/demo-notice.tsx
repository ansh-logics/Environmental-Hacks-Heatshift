import { DEMO_DATA_NOTICE } from '@heatshift/shared';
import { cn } from '../../lib/utils';

/** Every screen that renders seeded data must say so out loud. */
export function DemoNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'rounded-xl border-2 border-dashed border-heat-moderate/50 bg-heat-moderate/5 px-3 py-2 text-xs font-semibold text-ink-700',
        className,
      )}
    >
      {DEMO_DATA_NOTICE}
    </p>
  );
}
