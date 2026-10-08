import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * The desktop content grid: 12 fluid columns from 1024px up, single column
 * below. Keeps pages from collapsing into a narrow phone column on a laptop.
 */
export function ContentGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:gap-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

const SPANS: Record<number, string> = {
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  12: 'lg:col-span-12',
};

/** Column placement; `span` is the desktop column count (mobile is full width). */
export function GridColumn({
  span = 12,
  className,
  children,
}: {
  span?: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn(SPANS[span], className)}>{children}</div>;
}
