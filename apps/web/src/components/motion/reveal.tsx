import type { ReactNode } from 'react';
import { m, type Variants } from 'motion/react';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

/**
 * The whole app's entrance feel lives here. Short, small, and only ever
 * opacity + a short vertical translate - no scale, blur or filter work.
 */
export const MOTION = {
  duration: 0.22,
  distance: 8,
  stagger: 0.06,
  ease: 'easeOut',
} as const;

const itemVariants: Variants = {
  hidden: { opacity: 0, y: MOTION.distance },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
  },
};

const containerVariants = (delayChildren: number): Variants => ({
  hidden: {},
  shown: { transition: { staggerChildren: MOTION.stagger, delayChildren } },
});

/** One-off entrance. Mounts, plays once, then never again. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  if (usePrefersReducedMotion()) return <div className={className}>{children}</div>;

  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: MOTION.distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.duration, ease: MOTION.ease, delay }}
    >
      {children}
    </m.div>
  );
}

/** Parent that hands its own timing down to `StaggeredItem` children. */
export function StaggeredGroup({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  if (usePrefersReducedMotion()) return <div className={className}>{children}</div>;

  return (
    <m.div
      className={className}
      variants={containerVariants(delay)}
      initial="hidden"
      animate="shown"
    >
      {children}
    </m.div>
  );
}

/** A member of a `StaggeredGroup`. Renders nothing but a translated, faded box. */
export function StaggeredItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  if (usePrefersReducedMotion()) return <div className={className}>{children}</div>;

  return (
    <m.div className={className} variants={itemVariants}>
      {children}
    </m.div>
  );
}
