import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TitledCard } from "../TitledCard";

describe("TitledCard", () => {
  it("renders the title and children", () => {
    render(
      <TitledCard title="Section title">
        <p>body</p>
      </TitledCard>,
    );

    expect(screen.getByText("Section title")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });
});
