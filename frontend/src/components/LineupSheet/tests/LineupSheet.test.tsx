import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LineupSheet } from "../LineupSheet";
import { lineupFor, playerFor } from "@/test-mocks";

describe("LineupSheet", () => {
  it("lays out lines, pairs, the starter, and special teams", () => {
    render(
      <LineupSheet
        lineup={lineupFor({
          power_play_units: [
            [
              playerFor(12, { last_name: "Matthews" }),
              playerFor(13, { last_name: "Nylander" }),
              playerFor(21, { last_name: "Rielly" }),
              playerFor(41, { last_name: "Domi" }),
              playerFor(42, { last_name: "McCabe" }),
            ],
          ],
        })}
      />,
    );

    expect(screen.getByText("L1")).toBeInTheDocument();
    expect(screen.getByText("Test Knies")).toBeInTheDocument();
    expect(screen.getByText("Test Stolarz")).toBeInTheDocument();
    expect(screen.getByText("Power Play")).toBeInTheDocument();
    expect(screen.getByText("PP1")).toBeInTheDocument();
    // A top player carried on both an even-strength line and the top unit.
    expect(screen.getAllByText("Test Matthews")).toHaveLength(2);
  });

  it("pads missing forward lines to the full L1–L4 skeleton", () => {
    render(<LineupSheet lineup={lineupFor()} />);

    expect(screen.getByText("L4")).toBeInTheDocument();
    expect(screen.queryByText("Power Play")).not.toBeInTheDocument();
  });
});
