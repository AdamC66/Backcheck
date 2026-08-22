// Derives avatar initials from an email (or name) until users have real display names.
export function initialsFrom(identifier: string): string {
  const localPart = identifier.trim().split("@")[0] ?? "";
  const segments = localPart.split(/[.\-_+\s]+/).filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return "?";
  }

  return segments
    .slice(0, 2)
    .map((segment) => segment.charAt(0))
    .join("")
    .toUpperCase();
}
