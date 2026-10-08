import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type BadgeTone = 'neutral' | 'low' | 'moderate' | 'high' | 'severe' | 'info';

/**
 * Tone names follow the heat levels so a badge and its plan stay in sync:
 * low = safe/green, moderate = caution/amber, severe = urgent/red.
 */
const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-sand-100 text-ink-700 border-sand-300',
  low: 'bg-heat-low/10 text-heat-low border-heat-low/30',
  moderate: 'bg-heat-moderate/10 text-heat-moderate border-heat-moderate/30',
  high: 'bg-heat-high/10 text-heat-high border-heat-high/30',
  severe: 'bg-heat-severe/10 text-heat-severe border-heat-severe/30',
  info: 'bg-white text-ink-500 border-sand-300',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-[0.06em]',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
