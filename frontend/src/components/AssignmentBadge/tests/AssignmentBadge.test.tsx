import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssignmentBadge } from "../AssignmentBadge";
import { teamFor } from "@/test-mocks";

describe("AssignmentBadge", () => {
  it("shows the affiliate team's abbreviation and a title naming it", () => {
    render(
      <AssignmentBadge
        assignment={{
          team: { ...teamFor(3, "MRL"), name: "Toronto Marlies" },
          contract_level: "ahl",
          contract_level_inferred: false,
        }}
      />,
    );

    expect(screen.getByTitle("Assigned to Toronto Marlies")).toHaveTextContent("MRL");
  });

  it("renders nothing when there's no assignment", () => {
    const { container } = render(<AssignmentBadge assignment={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
