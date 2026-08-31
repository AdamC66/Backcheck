import { describe, expect, it } from "vitest";
import { lineupFor, playerFor } from "@/test-mocks";
import {
  draftFromLineup,
  draftToInput,
  emptyDraft,
  placementLabel,
  withPlayerAt,
  withScratch,
} from "../lineup";

describe("draftFromLineup / draftToInput", () => {
  it("round-trips a lineup through the editable draft shape", () => {
    const lineup = lineupFor({
      power_play_units: [
        [playerFor(12), playerFor(13), playerFor(21), playerFor(41), playerFor(42)],
      ],
      scratches: [playerFor(99)],
    });

    const input = draftToInput(draftFromLineup(lineup));

    expect(input.forward_lines[0]).toEqual([11, 12, 13]);
    expect(input.defense_pairs[0]).toEqual([21, 22]);
    expect(input.power_play_units[0]).toEqual([12, 13, 21, 41, 42]);
    expect(input.starting_goalie_id).toBe(31);
    expect(input.scratches).toEqual([99]);
  });
});

describe("withPlayerAt", () => {
  it("moves a skater between even-strength slots but leaves the power play alone", () => {
    let draft = emptyDraft();
    draft = withPlayerAt(draft, { group: "defense_pairs", unitIndex: 0, slotIndex: 0 }, 21);
    draft = withPlayerAt(draft, { group: "power_play_units", unitIndex: 0, slotIndex: 0 }, 21);

    // Same D-man onto a forward line: clears the pair, keeps the PP unit.
    draft = withPlayerAt(draft, { group: "forward_lines", unitIndex: 3, slotIndex: 1 }, 21);

    expect(placementLabel(draft, 21)).toBe("L4");
    expect(draft.power_play_units[0][0]).toBe(21);
    expect(draft.defense_pairs[0][0]).toBeNull();
  });

  it("drops a player out of the scratch list when they're dressed", () => {
    let draft = withScratch(emptyDraft(), 50);
    expect(placementLabel(draft, 50)).toBe("Scratch");

    draft = withPlayerAt(draft, { goalie: "starting" }, 50);

    expect(draft.scratch_ids).not.toContain(50);
    expect(placementLabel(draft, 50)).toBe("Starter");
  });
});
