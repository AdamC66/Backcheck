import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Row } from "../Row";

describe("Row", () => {
  it("lays children out horizontally with alignment applied", () => {
    render(
      <Row gap="sm" justify="between">
        <span>left</span>
        <span>right</span>
      </Row>,
    );

    expect(screen.getByText("left").parentElement).toHaveClass(
      "flex",
      "flex-row",
      "gap-2",
      "items-center",
      "justify-between",
    );
  });
});
