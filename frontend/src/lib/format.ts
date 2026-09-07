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

// A ".921" reads as a save percentage; "0.921" or "92.1%" don't, on any stats site.
export function formatSavePctg(value: number | null): string {
  return value === null ? "—" : value.toFixed(3).replace(/^0/, "");
}

// "7:24" — a period clock (minutes:seconds elapsed), not an average, so no games divisor.
export function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

// Regulation periods read as "1st/2nd/3rd"; anything past that is overtime ("OT", "2OT", …).
// A regular-season shootout is stored as its own period and would show as the next "OT" —
// acceptable, since no game_type reaches this call.
export function periodLabel(period: number): string {
  if (period <= 3) return ordinal(period);
  return period === 4 ? "OT" : `${period - 3}OT`;
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

// "18:24" — per-game average, computed from a season total already stored in seconds.
export function formatToi(totalSeconds: number, gamesPlayed: number): string {
  if (gamesPlayed === 0) return "—";

  const perGame = Math.round(totalSeconds / gamesPlayed);
  const minutes = Math.floor(perGame / 60);
  const seconds = perGame % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
