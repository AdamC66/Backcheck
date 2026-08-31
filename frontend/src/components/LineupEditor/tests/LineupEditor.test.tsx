import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/react";
import { LineupEditor } from "../LineupEditor";
import { lineupFor, playerFor, rosterEntryFor } from "@/test-mocks";

const ROSTER = [
  rosterEntryFor({
    player: playerFor(1, { first_name: "Auston", last_name: "Matthews", position: "left_wing" }),
    jersey_number: 34,
  }),
  rosterEntryFor({
    player: playerFor(2, { first_name: "William", last_name: "Nylander", position: "right_wing" }),
    jersey_number: 88,
  }),
];

describe("LineupEditor", () => {
  it("assigns a player to a slot and saves the compacted lineup", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<LineupEditor initialLineup={null} roster={ROSTER} isSaving={false} onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: "L1 LW — add player" }));

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /Auston Matthews/ }));

    expect(screen.getByRole("button", { name: "L1 LW — Auston Matthews" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save lineup" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ forward_lines: [[1], [], [], []] }),
    );
  });

  it("keeps Save disabled until something changes", () => {
    render(<LineupEditor initialLineup={null} roster={ROSTER} isSaving={false} onSave={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Save lineup" })).toBeDisabled();
  });

  it("reports dirtiness to its parent", async () => {
    const user = userEvent.setup();
    const onDirtyChange = vi.fn();

    render(
      <LineupEditor
        initialLineup={null}
        roster={ROSTER}
        isSaving={false}
        onSave={vi.fn()}
        onDirtyChange={onDirtyChange}
      />,
    );

    expect(onDirtyChange).toHaveBeenLastCalledWith(false);

    await user.click(screen.getByRole("button", { name: "L1 LW — add player" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: /Auston Matthews/ }),
    );

    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  });

  it("seeds a fresh lineup from the previous game on request", async () => {
    const user = userEvent.setup();
    const template = lineupFor({
      forward_lines: [[playerFor(1), playerFor(2)]],
      defense_pairs: [],
      power_play_units: [],
      penalty_kill_units: [],
      starting_goalie: null,
      scratches: [],
    });

    render(
      <LineupEditor
        initialLineup={null}
        roster={ROSTER}
        isSaving={false}
        onSave={vi.fn()}
        templateLineup={template}
        templateLabel="Oct 12 @ BOS"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Start from Oct 12 @ BOS" }));

    expect(screen.getByRole("button", { name: "L1 LW — Auston Matthews" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save lineup" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Start from/ })).not.toBeInTheDocument();
  });
});
