import { DateTime } from "effect";

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

const compactCurrency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  currencyDisplay: "narrowSymbol",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatMoney = (value: number): string => currency.format(value);
export const formatMoneyCompact = (value: number): string => compactCurrency.format(value);

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

export const formatDate = (date: DateTime.DateTime): string =>
  dateFormat.format(DateTime.toDateUtc(date));

export const formatDateTime = (date: DateTime.DateTime): string =>
  dateTimeFormat.format(DateTime.toDateUtc(date));

/** A `YYYY-MM-DD` calendar date, shown without shifting it by the time zone. */
export const formatCalendarDate = (date: string): string =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );

const units: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "3 hours ago", "yesterday", "just now". */
export const formatRelative = (date: DateTime.DateTime, now: number = Date.now()): string => {
  const seconds = (DateTime.toEpochMillis(date) - now) / 1000;
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "just now";
};

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/** A bare host for display: "https://www.acme.com/" → "acme.com". */
export const formatDomain = (domain: string): string =>
  domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
