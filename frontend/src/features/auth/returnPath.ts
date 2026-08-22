// react-router types location state as unknown-ish, so the `from` a guard stashed has to
// be narrowed rather than trusted. The leading-slash check keeps it an in-app path — a
// value like "https://elsewhere" would otherwise become an open redirect after login.
export function returnPathFrom(state: unknown): string {
  if (typeof state === "object" && state !== null && "from" in state) {
    const from: unknown = (state as { from: unknown }).from;

    if (typeof from === "string" && from.startsWith("/") && !from.startsWith("//")) {
      return from;
    }
  }

  return "/";
}
