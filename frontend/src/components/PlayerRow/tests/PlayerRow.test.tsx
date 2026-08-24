import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayerRow } from "../PlayerRow";
import { rosterEntryFor, playerFor } from "@/test-mocks";

describe("PlayerRow", () => {
  it("shows the player's name and position", () => {
    render(
      <ul>
        <PlayerRow
          entry={rosterEntryFor({
            player: playerFor(1, { last_name: "Matthews", position: "center" }),
          })}
          canManageRoster={false}
          onManageStatus={vi.fn()}
        />
      </ul>,
    );

    expect(screen.getByText("Test Matthews")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Manage" })).not.toBeInTheDocument();
  });

  it("calls onManageStatus when the team's GM clicks Manage", async () => {
    const user = userEvent.setup();
    const onManageStatus = vi.fn();
    const entry = rosterEntryFor({ player: playerFor(1) });

    render(
      <ul>
        <PlayerRow entry={entry} canManageRoster onManageStatus={onManageStatus} />
      </ul>,
    );

    await user.click(screen.getByRole("button", { name: "Manage" }));

    expect(onManageStatus).toHaveBeenCalledWith(entry);
  });
});
