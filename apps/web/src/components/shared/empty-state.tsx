import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function EmptyState({
  title,
  body,
  className,
}: {
  title: string;
  body?: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'rounded-xl border border-dashed border-sand-300 bg-sand-50 p-4 text-sm text-ink-500',
        className,
      )}
    >
      <span className="block font-semibold text-ink-700">{title}</span>
      {body}
    </p>
  );
}
