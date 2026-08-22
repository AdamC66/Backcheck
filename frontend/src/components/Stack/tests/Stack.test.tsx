import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stack } from "../Stack";

describe("Stack", () => {
  it("renders children stacked vertically with the requested gap", () => {
    render(
      <Stack gap="lg">
        <span>first</span>
        <span>second</span>
      </Stack>,
    );

    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("second").parentElement).toHaveClass("flex", "flex-col", "gap-6");
  });
});
