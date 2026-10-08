import { useEffect, useRef, useState } from 'react';
import { animate } from 'motion/react';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

/**
 * Interpolates a real number that has already arrived from the API. It never
 * invents a value: the target is the server's number, and with reduced motion
 * the target is returned immediately.
 *
 * `from` only seeds the first mount, so re-renders with an unchanged value do
 * not replay the animation.
 */
export function useCountUp(
  target: number,
  { from, duration = 0.4 }: { from?: number; duration?: number } = {},
): number {
  const reduced = usePrefersReducedMotion();
  // With reduced motion the first paint must already show the real value.
  const initial = reduced ? target : (from ?? target);
  const [value, setValue] = useState(initial);
  const currentRef = useRef(initial);

  useEffect(() => {
    if (reduced) {
      currentRef.current = target;
      setValue(target);
      return;
    }
    if (currentRef.current === target) return;

    const controls = animate(currentRef.current, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (next) => {
        currentRef.current = next;
        setValue(next);
      },
    });
    return () => controls.stop();
  }, [target, reduced, duration]);

  return value;
}
