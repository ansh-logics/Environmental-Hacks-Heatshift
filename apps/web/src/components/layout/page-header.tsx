import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * Page-level title block. `meta` renders as a quiet chip row so a page can show
 * context (role, city, shift window) without a second card.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  meta,
  action,
  className,
}: {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="text-2xl leading-tight lg:text-[1.75rem]">{title}</h1>
        {subtitle ? (
          <p className="mt-1 max-w-prose text-sm text-ink-500">{subtitle}</p>
        ) : null}
        {meta ? <div className="mt-3 flex flex-wrap gap-2">{meta}</div> : null}
      </div>
      {action ? <div className="shrink-0 sm:pt-1">{action}</div> : null}
    </div>
  );
}

/** Small pill of context used inside PageHeader `meta`. */
export function MetaChip({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-sand-100 px-2.5 text-xs font-semibold text-ink-700">
      {icon ? <span className="text-ink-400">{icon}</span> : null}
      {children}
    </span>
  );
}
