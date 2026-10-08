import type { ReactNode } from 'react';

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg">{title}</h2>
        {description ? <p className="text-sm text-ink-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
