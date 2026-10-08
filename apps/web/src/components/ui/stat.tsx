import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/** Compact label-over-value tile: heat plan numbers, snapshot rows. */
export function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('stat-tile', className)}>
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-lg font-bold leading-tight tabular text-ink-900">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}

/** Headline metric used on the coordinator grid. */
export function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'low' | 'moderate' | 'severe';
  icon?: ReactNode;
}) {
  const accent = {
    neutral: 'text-ink-900',
    low: 'text-heat-low',
    moderate: 'text-heat-moderate',
    severe: 'text-heat-severe',
  }[tone];

  return (
    <div className="card h-full">
      <div className="flex items-start justify-between gap-2">
        <p className="eyebrow">{label}</p>
        {icon ? <span className="text-ink-400">{icon}</span> : null}
      </div>
      <p className={cn('mt-2 text-3xl font-extrabold leading-none tabular', accent)}>
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs leading-snug text-ink-500">{hint}</p> : null}
    </div>
  );
}
