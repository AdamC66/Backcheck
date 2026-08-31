import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/react";
import { LineupEditor } from "../LineupEditor";
import { playerFor, rosterEntryFor } from "@/test-mocks";

const ROSTER = [
  rosterEntryFor({
    player: playerFor(1, { first_name: "Auston", last_name: "Matthews" }),
    jersey_number: 34,
  }),
  rosterEntryFor({
    player: playerFor(2, { first_name: "William", last_name: "Nylander" }),
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
});
