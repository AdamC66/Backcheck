import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ChevronIcon } from "../ChevronIcon";

describe("ChevronIcon", () => {
  it("points the arrow the requested direction", () => {
    const { container, rerender } = render(<ChevronIcon direction="left" />);
    const leftPath = container.querySelector("path")?.getAttribute("d");

    rerender(<ChevronIcon direction="right" />);
    const rightPath = container.querySelector("path")?.getAttribute("d");

    expect(leftPath).not.toEqual(rightPath);
  });
});
