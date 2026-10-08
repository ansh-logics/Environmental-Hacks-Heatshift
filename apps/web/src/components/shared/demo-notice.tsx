import { DEMO_DATA_NOTICE } from '@heatshift/shared';
import { cn } from '../../lib/utils';
import { IconInfo } from '../ui/icons';

/** Every screen that renders seeded data must say so out loud. */
export function DemoNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-xl border border-dashed border-heat-moderate/60 bg-heat-moderate/5 px-3 py-2 text-xs font-semibold text-ink-700',
        className,
      )}
    >
      <IconInfo size={16} className="mt-px shrink-0 text-heat-moderate" />
      <span>{DEMO_DATA_NOTICE}</span>
    </p>
  );
}
