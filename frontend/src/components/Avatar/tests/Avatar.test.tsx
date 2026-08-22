import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "../Avatar";

describe("Avatar", () => {
  it("renders initials hidden from assistive tech", () => {
    render(<Avatar name="adam.cote@example.com" />);

    const initials = screen.getByText("AC");

    expect(initials).toBeInTheDocument();
    expect(initials).toHaveAttribute("aria-hidden", "true");
  });
});
