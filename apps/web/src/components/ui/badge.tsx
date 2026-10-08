import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type BadgeTone = 'neutral' | 'low' | 'moderate' | 'high' | 'severe' | 'info';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-sand-100 text-ink-700 border-sand-300',
  low: 'bg-heat-low/10 text-heat-low border-heat-low/40',
  moderate: 'bg-heat-moderate/10 text-heat-moderate border-heat-moderate/40',
  high: 'bg-heat-high/10 text-heat-high border-heat-high/40',
  severe: 'bg-heat-severe/10 text-heat-severe border-heat-severe/40',
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
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
