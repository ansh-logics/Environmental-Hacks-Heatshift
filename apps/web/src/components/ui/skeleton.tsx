import { cn } from '../../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-sand-200', className)} aria-hidden />
  );
}
