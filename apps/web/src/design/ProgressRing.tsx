import { Meter } from "@base-ui/react/meter";

export interface ProgressRingProps {
  readonly value: number;
  readonly max: number;
  readonly label: string;
  readonly size?: number;
}

/**
 * An Activity-style ring. Uses Base UI's Meter for the semantics (role="meter"
 * with value text) and draws the ring itself.
 */
export function ProgressRing({ value, max, label, size = 44 }: ProgressRingProps) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const fraction = max === 0 ? 0 : Math.min(value / max, 1);
  const complete = max > 0 && value >= max;

  return (
    <Meter.Root
      value={value}
      max={Math.max(max, 1)}
      aria-label={label}
      getAriaValueText={() => `${value} of ${max} done`}
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-fill"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className={
            "transition-[stroke-dashoffset,stroke] duration-700 ease-out-expo " +
            (complete ? "stroke-success" : "stroke-accent")
          }
          style={{ opacity: fraction === 0 ? 0 : 1 }}
        />
      </svg>
      <span className="absolute text-caption font-semibold tabular-nums text-label-2">
        {max === 0 ? "–" : `${Math.round(fraction * 100)}%`}
      </span>
    </Meter.Root>
  );
}
