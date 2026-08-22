import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Text } from "../Text";

describe("Text", () => {
  it("renders a heading variant as a real heading element", () => {
    render(<Text variant="heading">Roster</Text>);

    expect(screen.getByRole("heading", { level: 1, name: "Roster" })).toBeInTheDocument();
  });

  it("applies the danger tone", () => {
    render(<Text tone="danger">Something broke</Text>);

    expect(screen.getByText("Something broke")).toHaveClass("text-red-600");
  });
});
