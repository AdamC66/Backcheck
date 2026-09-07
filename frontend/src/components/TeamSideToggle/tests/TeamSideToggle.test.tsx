import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { TEAMS } from "@/test-mocks";
import { TeamSideToggle } from "../TeamSideToggle";

describe("TeamSideToggle", () => {
  it("labels each side with the team abbreviation and reports a switch", async () => {
    const onChange = vi.fn();
    render(<TeamSideToggle away={TEAMS[1]} home={TEAMS[0]} value="away" onChange={onChange} />);

    const awayButton = screen.getByRole("button", { name: /BOS \[Away\]/ });
    expect(awayButton).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(screen.getByRole("button", { name: /ANA \[Home\]/ }));
    expect(onChange).toHaveBeenCalledWith("home");
  });
});
