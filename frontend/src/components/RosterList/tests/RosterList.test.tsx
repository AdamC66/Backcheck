import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { RosterList } from "../RosterList";
import { rosterEntryFor, playerFor, teamFor } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";

describe("RosterList", () => {
  it("renders each section under its label, keeping an injured player inline", () => {
    renderWithProviders(
      <RosterList
        sections={[
          {
            key: "forwards",
            label: "Forwards",
            entries: [
              rosterEntryFor({ player: playerFor(1, { last_name: "Active" }) }),
              rosterEntryFor({
                player: playerFor(2, { last_name: "Hurt" }),
                roster_status: { status: "injured_reserve", started_on: "2026-08-20" },
              }),
            ],
          },
        ]}
        canManageRoster={false}
        affiliateTeams={[]}
        onSetStatus={vi.fn()}
        onSendDown={vi.fn()}
        onCallUp={vi.fn()}
      />,
    );

    expect(screen.getByText("Forwards")).toBeInTheDocument();
    expect(screen.getByText("Test Hurt").closest("li")).toHaveTextContent("IR");
  });

  it("omits an empty section entirely rather than rendering it with nothing in it", () => {
    renderWithProviders(
      <RosterList
        sections={[{ key: "forwards", label: "Forwards", entries: [] }]}
        canManageRoster={false}
        affiliateTeams={[]}
        onSetStatus={vi.fn()}
        onSendDown={vi.fn()}
        onCallUp={vi.fn()}
      />,
    );

    expect(screen.queryByText("Forwards")).not.toBeInTheDocument();
  });

  it("lets the team's GM open the status dialog, choose a status, and confirm a retroactive date", async () => {
    const user = userEvent.setup();
    const onSetStatus = vi.fn();

    renderWithProviders(
      <RosterList
        sections={[
          {
            key: "forwards",
            label: "Forwards",
            entries: [rosterEntryFor({ player: playerFor(1, { last_name: "Matthews" }) })],
          },
        ]}
        canManageRoster
        affiliateTeams={[]}
        onSetStatus={onSetStatus}
        onSendDown={vi.fn()}
        onCallUp={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Manage" }));
    await user.click(screen.getByRole("button", { name: "Injured Reserve" }));

    const dateInput = screen.getByLabelText("In effect as of");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-08-20");

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onSetStatus).toHaveBeenCalledWith(1, "injured_reserve", "2026-08-20");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("doesn't show a manage action to a user who isn't the team's GM", () => {
    renderWithProviders(
      <RosterList
        sections={[
          {
            key: "forwards",
            label: "Forwards",
            entries: [rosterEntryFor({ player: playerFor(1) })],
          },
        ]}
        canManageRoster={false}
        affiliateTeams={[]}
        onSetStatus={vi.fn()}
        onSendDown={vi.fn()}
        onCallUp={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Manage" })).not.toBeInTheDocument();
  });

  it("lets the team's GM send a player down to an affiliate", async () => {
    const user = userEvent.setup();
    const onSendDown = vi.fn();

    renderWithProviders(
      <RosterList
        sections={[
          {
            key: "forwards",
            label: "Forwards",
            entries: [rosterEntryFor({ player: playerFor(1, { last_name: "Matthews" }) })],
          },
        ]}
        canManageRoster
        affiliateTeams={[teamFor(3, "MRL")]}
        onSetStatus={vi.fn()}
        onSendDown={onSendDown}
        onCallUp={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Send down" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onSendDown).toHaveBeenCalledWith(1, 3);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("doesn't offer to send down a player already on loan at an affiliate", () => {
    renderWithProviders(
      <RosterList
        sections={[
          {
            key: "forwards",
            label: "Forwards",
            entries: [
              rosterEntryFor({
                player: playerFor(1, { last_name: "Cowan" }),
                assignment: {
                  team: teamFor(3, "MRL"),
                  contract_level: "ahl",
                  contract_level_inferred: false,
                },
              }),
            ],
          },
        ]}
        canManageRoster
        affiliateTeams={[teamFor(3, "MRL")]}
        onSetStatus={vi.fn()}
        onSendDown={vi.fn()}
        onCallUp={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Send down" })).not.toBeInTheDocument();
  });

  it("lets the team's GM call a player back up from an affiliate", async () => {
    const user = userEvent.setup();
    const onCallUp = vi.fn();

    renderWithProviders(
      <RosterList
        sections={[
          {
            key: "forwards",
            label: "Forwards",
            entries: [
              rosterEntryFor({
                player: playerFor(1, { last_name: "Cowan" }),
                assignment: {
                  team: teamFor(3, "MRL"),
                  contract_level: "ahl",
                  contract_level_inferred: false,
                },
              }),
            ],
          },
        ]}
        canManageRoster
        affiliateTeams={[teamFor(3, "MRL")]}
        onSetStatus={vi.fn()}
        onSendDown={vi.fn()}
        onCallUp={onCallUp}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Call up" }));
    expect(onCallUp).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onCallUp).toHaveBeenCalledWith(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
