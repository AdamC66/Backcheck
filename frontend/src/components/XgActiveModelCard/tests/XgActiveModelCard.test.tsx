import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { XgActiveModelCard } from "../XgActiveModelCard";

describe("XgActiveModelCard", () => {
  it("shows the version and coefficients when a model is active", () => {
    render(
      <XgActiveModelCard
        model={{
          version: "v1-full",
          trained_at: "2026-09-07T00:00:00Z",
          created_at: "2026-09-07T00:00:00Z",
          coefficients: { intercept: -1.5, distance: -0.03 },
        }}
      />,
    );

    expect(screen.getByText("v1-full")).toBeInTheDocument();
    expect(screen.getByText("intercept")).toBeInTheDocument();
  });

  it("shows an empty state when no model is active", () => {
    render(<XgActiveModelCard model={null} />);

    expect(screen.getByText("No model is active.")).toBeInTheDocument();
  });
});
