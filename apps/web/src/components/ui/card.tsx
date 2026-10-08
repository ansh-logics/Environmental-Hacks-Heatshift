import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function Card({
  title,
  eyebrow,
  action,
  className,
  children,
}: {
  title?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn('card', className)}>
      {title || action ? (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                {eyebrow}
              </p>
            ) : null}
            {title ? <h2 className="text-lg leading-snug">{title}</h2> : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
