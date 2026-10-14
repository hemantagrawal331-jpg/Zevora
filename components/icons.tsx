import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16.5 20 20.5" />
    </svg>
  );
}

export function AccountIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.2c1.4-2.8 3.6-4.2 6.5-4.2s5.1 1.4 6.5 4.2" />
    </svg>
  );
}

export function HeartIcon({
  filled,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(props)} fill={filled ? "currentColor" : "none"}>
      <path d="M12 19.4s-6.6-4.1-6.6-8.3A3.4 3.4 0 0 1 12 8.2a3.4 3.4 0 0 1 6.6 2.9c0 4.2-6.6 8.3-6.6 8.3Z" />
    </svg>
  );
}

export function BagIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6.5 8.5h11l-.7 11h-9.6l-.7-11Z" />
      <path d="M9 8.5V7.2A3 3 0 0 1 12 4.2 3 3 0 0 1 15 7.2v1.3" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7.5h16M4 12h16M4 16.5h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  );
}
