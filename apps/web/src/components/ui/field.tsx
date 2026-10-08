import type { ReactNode } from 'react';

/** Label + control + hint, used by every form on the dashboard. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink-700">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs leading-snug text-ink-500">{hint}</p> : null}
    </div>
  );
}
