import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "../Card";

describe("Card", () => {
  it("renders its children on a bordered surface by default", () => {
    render(<Card>Roster</Card>);

    expect(screen.getByText("Roster").className).toContain("border-slate-200");
  });

  it("swaps the border for a shadow when elevated", () => {
    render(<Card variant="elevated">Roster</Card>);

    const surface = screen.getByText("Roster");

    expect(surface.className).toContain("shadow-sm");
    expect(surface.className).not.toContain("border-slate-200");
  });
});
