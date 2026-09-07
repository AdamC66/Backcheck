import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InlineCode } from "../InlineCode";

describe("InlineCode", () => {
  it("renders its children inside a <code> element", () => {
    render(<InlineCode>XgModel</InlineCode>);

    expect(screen.getByText("XgModel").tagName).toBe("CODE");
  });
});
