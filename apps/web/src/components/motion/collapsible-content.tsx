import { useId, useState, type ReactNode } from 'react';
import { m } from 'motion/react';
import { IconChevron } from '../ui/icons';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';
import { MOTION } from './reveal';

/**
 * The animated panel of a disclosure. Height + opacity only.
 *
 * The panel stays mounted so it can animate out, which means it must be made
 * unavailable to keyboard and assistive tech while closed - `inert` does that
 * without display:none, which would break the height transition.
 */
export function CollapsibleContent({
  open,
  id,
  labelledBy,
  children,
  className,
}: {
  open: boolean;
  id?: string;
  labelledBy?: string;
  children: ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return open ? (
      <div id={id} role="region" aria-labelledby={labelledBy} className={className}>
        {children}
      </div>
    ) : null;
  }

  return (
    <m.div
      id={id}
      role="region"
      aria-labelledby={labelledBy}
      inert={!open}
      initial={false}
      animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
      style={{ overflow: 'hidden' }}
      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
      className={className}
    >
      {children}
    </m.div>
  );
}

/**
 * A disclosure with a real `<button>` trigger: native Enter / Space handling,
 * visible focus ring, and `aria-expanded` / `aria-controls` that stay in sync
 * with the animation. Replaces the two `<details>` elements in the app.
 */
export function Disclosure({
  label,
  children,
  className,
  triggerClassName,
  chevronSize = 14,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
  chevronSize?: number;
}) {
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const triggerId = useId();
  const panelId = useId();

  return (
    <div className={className}>
      <button
        type="button"
        id={triggerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={triggerClassName}
      >
        {reduced ? (
          <span aria-hidden className="inline-flex shrink-0">
            <IconChevron size={chevronSize} />
          </span>
        ) : (
          <m.span
            aria-hidden
            className="inline-flex shrink-0"
            initial={false}
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <IconChevron size={chevronSize} />
          </m.span>
        )}
        {label}
      </button>

      <CollapsibleContent open={open} id={panelId} labelledBy={triggerId}>
        <div className="pt-2">{children}</div>
      </CollapsibleContent>
    </div>
  );
}
