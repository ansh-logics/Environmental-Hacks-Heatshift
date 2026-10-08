import type { ReactNode } from 'react';
import { LazyMotion, domMin } from 'motion/react';

/**
 * Loads only the core animation feature - HeatShift has no exit, drag or
 * gesture animations, so `domMin` keeps the PWA bundle as small as Motion
 * allows. `strict` makes it a build-time error to reach for the heavier
 * `motion` component tree.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMin} strict>
      {children}
    </LazyMotion>
  );
}
