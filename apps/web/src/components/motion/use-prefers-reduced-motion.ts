import { useReducedMotion } from 'motion/react';

/**
 * Single source of truth for motion gating. Every wrapper in this folder
 * renders plain, immediately-visible DOM when this is true, so no sliding,
 * scaling, stagger or count-up survives `prefers-reduced-motion: reduce`.
 */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}
