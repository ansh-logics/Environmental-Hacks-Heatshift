import type { SVGProps } from 'react';

/** Inline SVGs only: no icon package in the bundle for low-end devices. */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconGauge = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 20a8 8 0 1 0-8-8" />
    <path d="M12 12l4-3" />
    <path d="M4 20h16" />
  </Svg>
);

export const IconPin = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" />
    <circle cx="12" cy="11" r="2.2" />
  </Svg>
);

export const IconPeople = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 6.5a3 3 0 0 1 0 5.5" />
    <path d="M17.5 14.5A6 6 0 0 1 21 20" />
  </Svg>
);

export const IconDrop = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3s6 6.6 6 10.5a6 6 0 0 1-12 0C6 9.6 12 3 12 3Z" />
  </Svg>
);

export const IconShade = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 12a9 9 0 0 1 18 0Z" />
    <path d="M12 12v8" />
    <path d="M9 20h6" />
  </Svg>
);

export const IconCheck = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.5 2.5 2.5L16 9.5" />
  </Svg>
);

export const IconAlert = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 4 3 19h18Z" />
    <path d="M12 10v4" />
    <path d="M12 16.5v.5" />
  </Svg>
);

export const IconSun = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </Svg>
);

export const IconClinic = (props: IconProps) => (
  <Svg {...props}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M12 8v8M8 12h8" />
  </Svg>
);

export const IconSnow = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3v18M4 7l16 10M20 7 4 17" />
  </Svg>
);

export const IconPlate = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.5" />
  </Svg>
);

export const IconRefresh = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 12a8 8 0 1 1-2.4-5.7" />
    <path d="M20 4v5h-5" />
  </Svg>
);

export const RELIEF_ICONS = {
  water: IconDrop,
  shade: IconShade,
  clinic: IconClinic,
  cooling_space: IconSnow,
  canteen: IconPlate,
} as const;

export const NAV_ICONS = {
  gauge: IconGauge,
  pin: IconPin,
  people: IconPeople,
} as const;
