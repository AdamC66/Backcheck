import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentedControl } from "../SegmentedControl";

const OPTIONS = [
  { value: "league", label: "League" },
  { value: "wildcard", label: "Wild Card" },
  { value: "division", label: "Division", disabled: true },
];

describe("SegmentedControl", () => {
  it("reports the selected option to assistive tech", () => {
    render(
      <SegmentedControl
        options={OPTIONS}
        value="league"
        onChange={vi.fn()}
        label="Standings view"
      />,
    );

    expect(screen.getByRole("button", { name: "League" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Wild Card" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("emits the chosen value", async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        options={OPTIONS}
        value="league"
        onChange={onChange}
        label="Standings view"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Wild Card" }));

    expect(onChange).toHaveBeenCalledWith("wildcard");
  });

  it("does not emit for an unavailable option", async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        options={OPTIONS}
        value="league"
        onChange={onChange}
        label="Standings view"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Division" }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
