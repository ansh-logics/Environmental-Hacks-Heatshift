import type { ReliefPointType } from '@heatshift/shared';

/**
 * Marker appearance for the relief map, in its own module and free of any
 * mapbox-gl import, so the legend and the accessible marker labels can reuse it
 * without pulling the map bundle into the main chunk.
 *
 * Type is colour; verification is fill. A verified point is solid, an unverified
 * demo point is hollow with a coloured ring. Neither is ever carried by colour
 * alone: the marker's accessible name, the list and the detail panel all say it
 * in words.
 */
export const RELIEF_MARKER_COLOURS: Record<ReliefPointType, string> = {
  water: '#1668b3',
  shade: '#2b8a3e',
  clinic: '#c92a2a',
  cooling_space: '#6b3fa0',
  canteen: '#b8860b',
};

export const USER_MARKER_COLOUR = '#e8590c';

/**
 * The clickable box never changes size. Mapbox caches a marker's offset from its
 * element the first time it is added, so growing the element on selection would
 * slide the anchor off the coordinate it stands for. Only the dot inside grows.
 */
const HIT_SIZE = 30;
const DOT_SIZE = 16;
const SELECTED_DOT_SIZE = 22;

export type ReliefMarkerState = {
  type: ReliefPointType;
  verified: boolean;
  label: string;
  selected: boolean;
};

/**
 * A real button, so keyboard and screen-reader users get the same affordance the
 * map gives a mouse - Mapbox only positions it.
 */
export function createReliefMarkerElement(state: ReliefMarkerState): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  // Mapbox stamps role="img" on any marker element that has no role of its own,
  // which would hide the click. Claiming the role keeps it a real control.
  button.setAttribute('role', 'button');
  button.dataset.reliefMarker = 'true';
  Object.assign(button.style, {
    width: `${HIT_SIZE}px`,
    height: `${HIT_SIZE}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
    border: '0',
    background: 'transparent',
    cursor: 'pointer',
  } satisfies Partial<CSSStyleDeclaration>);

  button.appendChild(document.createElement('span'));
  styleReliefMarker(button, state);
  return button;
}

/**
 * Update in place rather than swapping elements: the marker a keyboard user just
 * activated is the focused node, and replacing it would drop that focus.
 */
export function styleReliefMarker(
  button: HTMLButtonElement,
  { type, verified, label, selected }: ReliefMarkerState,
): void {
  button.setAttribute('aria-label', label);
  const dot = button.firstElementChild;
  if (!(dot instanceof HTMLElement)) return;

  const colour = RELIEF_MARKER_COLOURS[type];
  const size = selected ? SELECTED_DOT_SIZE : DOT_SIZE;
  Object.assign(dot.style, {
    display: 'block',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '9999px',
    border: `2px solid ${verified ? '#ffffff' : colour}`,
    background: verified ? colour : '#ffffff',
    boxShadow: selected
      ? '0 0 0 3px #1c120d, 0 2px 6px rgba(28,18,13,0.35)'
      : '0 1px 4px rgba(28,18,13,0.35)',
    transition: 'width 120ms ease, height 120ms ease',
  } satisfies Partial<CSSStyleDeclaration>);
}

/** A different shape on purpose: "you" must not read as another relief point. */
export function createUserMarkerElement(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('role', 'img');
  wrapper.setAttribute('aria-label', 'Your position');
  Object.assign(wrapper.style, {
    width: '18px',
    height: '18px',
    borderRadius: '9999px',
    background: USER_MARKER_COLOUR,
    border: '3px solid #ffffff',
    boxShadow: '0 0 0 2px rgba(232,89,12,0.45), 0 2px 6px rgba(28,18,13,0.4)',
  } satisfies Partial<CSSStyleDeclaration>);
  return wrapper;
}
