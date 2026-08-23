import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { teamFor } from "@/test-mocks";
import { TeamTheme } from "../TeamTheme";

function coloured(primary: string | null, secondary: string | null = null) {
  return { ...teamFor(1, "TOR"), primary_color: primary, secondary_color: secondary };
}

function variables(container: HTMLElement) {
  const scope = container.firstChild as HTMLElement;

  return {
    primary: scope.style.getPropertyValue("--color-team-primary"),
    accent: scope.style.getPropertyValue("--color-team-accent"),
    contrast: scope.style.getPropertyValue("--color-team-contrast"),
  };
}

describe("TeamTheme", () => {
  it("publishes the team's colours as theme variables", () => {
    const { container } = render(
      <TeamTheme team={coloured("#00205B", "#B9975B")}>
        <span>child</span>
      </TeamTheme>,
    );

    expect(variables(container)).toEqual({
      primary: "#00205B",
      accent: "#B9975B",
      contrast: "#FFFFFF",
    });
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("switches the contrast variable for a light primary", () => {
    const { container } = render(
      <TeamTheme team={coloured("#FFD457")}>
        <span>child</span>
      </TeamTheme>,
    );

    expect(variables(container).contrast).toBe("#0F172A");
  });

  it("darkens the primary when the second colour would vanish against the page", () => {
    const { container } = render(
      <TeamTheme team={coloured("#00205B", "#FFFFFF")}>
        <span>child</span>
      </TeamTheme>,
    );

    expect(variables(container).accent).toMatch(/color-mix/);
  });

  it("leaves the defaults in place for a team with no colours", () => {
    const { container } = render(
      <TeamTheme team={coloured(null)}>
        <span>child</span>
      </TeamTheme>,
    );

    expect(variables(container).primary).toBe("");
    expect(variables(container).contrast).toBe("");
  });

  it("adds no box of its own", () => {
    const { container } = render(
      <TeamTheme team={coloured("#00205B")}>
        <span>child</span>
      </TeamTheme>,
    );

    expect(container.firstChild).toHaveClass("contents");
  });
});
