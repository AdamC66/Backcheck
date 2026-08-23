export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;

  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

// A "YYYY-MM-DD" date has no time of day, so new Date(date) parses it as UTC midnight —
// which prints as the previous day anywhere west of UTC. Forcing local midnight is what
// every date-only formatter below needs, so it's the one place that trick lives.
function parseLocalDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatWeekday(date: string): string {
  return parseLocalDate(date).toLocaleDateString(undefined, { weekday: "short" });
}

// "Mon 15" — compact, for a schedule row that already groups by month.
export function formatShortDay(date: string): string {
  return parseLocalDate(date).toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}

export function formatMonthDay(date: string): string {
  return parseLocalDate(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatMonthYear(date: string): string {
  return parseLocalDate(date).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function formatFullDate(date: string): string {
  return parseLocalDate(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// A full timestamp, unlike the date-only formatters above — it already carries a time
// of day, so there's no local-midnight ambiguity to guard against.
export function formatGameDateTime(startsAt: string): string {
  const day = new Date(startsAt).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return `${day} · ${formatTime(startsAt)}`;
}
