import { useCountUp } from './use-count-up';

/**
 * A number that counts to a value the API already returned.
 *
 * The moving digits are `aria-hidden`; assistive tech always reads the final
 * value from a screen-reader-only node, so it never hears an intermediate
 * count and never misses the real figure.
 */
export function AnimatedNumber({
  value,
  from = 0,
  duration = 0.4,
  className,
  srLabel,
}: {
  value: number;
  /** Starting point for the first mount only. Pass `null` to skip the count-up. */
  from?: number | null;
  duration?: number;
  className?: string;
  /** Extra words for the screen-reader-only copy, e.g. "out of 100". */
  srLabel?: string;
}) {
  const display = useCountUp(value, { from: from ?? value, duration });
  const final = Math.round(value);

  return (
    <>
      <span aria-hidden="true" className={className}>
        {Math.round(display)}
      </span>
      <span className="sr-only">{srLabel ? `${final} ${srLabel}` : final}</span>
    </>
  );
}
