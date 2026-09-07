import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { List } from "../List";

describe("List", () => {
  it("renders an unordered list by default", () => {
    render(<List items={["one", "two"]} />);

    expect(screen.getByRole("list").tagName).toBe("UL");
    expect(screen.getByText("one")).toBeInTheDocument();
  });

  it("renders an ordered list when asked", () => {
    render(<List ordered items={["step"]} />);

    expect(screen.getByRole("list").tagName).toBe("OL");
  });
});
