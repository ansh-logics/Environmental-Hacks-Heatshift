import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-heat-accent text-white hover:bg-heat-accent-dark disabled:bg-sand-400',
  secondary: 'bg-white text-ink-900 border-2 border-sand-300 hover:border-heat-accent',
  ghost: 'bg-transparent text-ink-700 hover:bg-sand-100',
  danger: 'bg-heat-severe text-white hover:brightness-95',
};

const SIZES: Record<Size, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-14 px-5 text-base',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-70',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  );
}
