import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * `quiet` is for supporting material (diagnostics, legends, notes) so it never
 * competes with the primary cards on a screen.
 */
export function Card({
  title,
  eyebrow,
  action,
  variant = 'default',
  className,
  children,
}: {
  title?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  variant?: 'default' | 'quiet';
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(variant === 'quiet' ? 'card-quiet' : 'card', className)}>
      {title || action ? (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? (
              <h2
                className={cn(
                  'leading-snug',
                  variant === 'quiet' ? 'text-base' : 'text-lg',
                )}
              >
                {title}
              </h2>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
