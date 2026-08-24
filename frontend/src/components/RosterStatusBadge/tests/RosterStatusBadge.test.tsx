import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RosterStatusBadge } from "../RosterStatusBadge";

describe("RosterStatusBadge", () => {
  it("labels injured reserve and non-roster distinctly", () => {
    const { rerender } = render(<RosterStatusBadge status="injured_reserve" />);
    expect(screen.getByText("IR")).toBeInTheDocument();

    rerender(<RosterStatusBadge status="non_roster" />);
    expect(screen.getByText("Non-Roster")).toBeInTheDocument();
  });

  it("renders nothing for an active player", () => {
    const { container } = render(<RosterStatusBadge status="active" />);

    expect(container).toBeEmptyDOMElement();
  });
});
