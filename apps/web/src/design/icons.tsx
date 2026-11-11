import type { ComponentProps } from "react";

/*
 * A small SF Symbols–style icon set: 24px grid, rounded caps and joins,
 * stroke width tuned to sit next to medium-weight text.
 */

type IconProps = ComponentProps<"svg">;

const Icon = ({ children, strokeWidth = 2, ...props }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  >
    {children}
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <Icon strokeWidth={2.4} {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon strokeWidth={3} {...props}>
    <path d="m5.5 12.5 4.25 4.25L18.5 7.5" />
  </Icon>
);

export const TrashIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 6.5h15M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />
    <path d="m6.5 6.5.85 12.1a2 2 0 0 0 2 1.9h5.3a2 2 0 0 0 2-1.9l.85-12.1M10 10.5v6M14 10.5v6" />
  </Icon>
);

export const SweepIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 7h11M4 12h7M4 17h5" />
    <path d="m14.5 14.5 5 5M19.5 14.5l-5 5" />
  </Icon>
);

export const ArrowClockwiseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M19.5 4.5v4h-4" />
  </Icon>
);

export const ExclamationIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5h.01" strokeWidth={2.4} />
  </Icon>
);

export const SparklesIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M10 3.5 11.6 8a2 2 0 0 0 1.4 1.4l4.5 1.6-4.5 1.6a2 2 0 0 0-1.4 1.4L10 18.5 8.4 14a2 2 0 0 0-1.4-1.4L2.5 11 7 9.4A2 2 0 0 0 8.4 8Z" />
    <path d="M18 3v4M16 5h4M18.5 16v3M17 17.5h3" />
  </Icon>
);

export const XMarkIcon = (props: IconProps) => (
  <Icon strokeWidth={2.4} {...props}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Icon>
);
