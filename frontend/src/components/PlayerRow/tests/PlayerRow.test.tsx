import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { PlayerRow } from "../PlayerRow";
import { rosterEntryFor, playerFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";

describe("PlayerRow", () => {
  it("shows the player's name and position", () => {
    renderWithProviders(
      <ul>
        <PlayerRow
          entry={rosterEntryFor({
            player: playerFor(1, { last_name: "Matthews", position: "center" }),
          })}
          canManageRoster={false}
          onManageStatus={vi.fn()}
          canSendDown={false}
          onSendDown={vi.fn()}
          onCallUp={vi.fn()}
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

    renderWithProviders(
      <ul>
        <PlayerRow
          entry={entry}
          canManageRoster
          onManageStatus={onManageStatus}
          canSendDown={false}
          onSendDown={vi.fn()}
          onCallUp={vi.fn()}
        />
      </ul>,
    );

    await user.click(screen.getByRole("button", { name: "Manage" }));

    expect(onManageStatus).toHaveBeenCalledWith(entry);
  });
});
