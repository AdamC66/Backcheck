// NHL play-by-play `descKey` slugs → display labels, for the ones whose plain
// de-hyphenated form reads wrong. Unlisted slugs fall through to sentence case.
const INFRACTION_LABELS: Record<string, string> = {
  "abuse-of-officials": "Abuse of officials",
  "butt-ending": "Butt-ending",
  "checking-from-behind": "Checking from behind",
  "closing-hand-on-puck": "Closing hand on puck",
  "cross-checking": "Cross-checking",
  "delaying-game": "Delay of game",
  "delaying-game-bench": "Delay of game (bench)",
  "delaying-game-face-off-violation": "Delay of game (faceoff violation)",
  "delaying-game-puck-over-glass": "Delay of game (puck over glass)",
  "delaying-game-smothering-puck": "Delay of game (smothering puck)",
  "delaying-game-unsuccessful-challenge": "Delay of game (failed challenge)",
  diving: "Embellishment",
  "game-misconduct": "Game misconduct",
  "goalie-leave-crease": "Goalie leaving the crease",
  "head-butting": "Head-butting",
  "high-sticking": "High-sticking",
  "holding-the-stick": "Holding the stick",
  "illegal-check-to-the-head": "Illegal check to the head",
  "illegal-equipment": "Illegal equipment",
  "instigator-misconduct": "Instigator misconduct",
  "interference-on-goalkeeper": "Goalie interference",
  "match-penalty": "Match penalty",
  "playing-without-a-helmet": "Playing without a helmet",
  "puck-over-glass": "Delay of game (puck over glass)",
  "roughing-removing-opponents-helmet": "Roughing",
  "slew-footing": "Slew-footing",
  "throwing-equipment": "Throwing equipment",
  "too-many-men-on-the-ice": "Too many men on the ice",
  "unsportsmanlike-conduct": "Unsportsmanlike conduct",
};

const PENALTY_SHOT_PREFIX = /^ps-/;
const DOUBLE_MINOR_SUFFIX = /-double-minor$/;

function sentenceCase(slug: string): string {
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function infractionLabel(descKey: string | null): string {
  if (descKey === null || descKey === "") return "Penalty";

  const doubleMinor = DOUBLE_MINOR_SUFFIX.test(descKey);
  const base = descKey.replace(DOUBLE_MINOR_SUFFIX, "").replace(PENALTY_SHOT_PREFIX, "");
  const label = INFRACTION_LABELS[base] ?? sentenceCase(base);

  return doubleMinor ? `${label} (double minor)` : label;
}
