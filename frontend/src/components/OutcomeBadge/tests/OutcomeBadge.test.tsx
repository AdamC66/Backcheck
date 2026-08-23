import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OutcomeBadge } from "../OutcomeBadge";

describe("OutcomeBadge", () => {
  it("labels a win, loss, and overtime loss distinctly", () => {
    const { rerender } = render(<OutcomeBadge outcome="win" />);
    expect(screen.getByText("W")).toBeInTheDocument();

    rerender(<OutcomeBadge outcome="loss" />);
    expect(screen.getByText("L")).toBeInTheDocument();

    rerender(<OutcomeBadge outcome="ot_loss" />);
    expect(screen.getByText("OTL")).toBeInTheDocument();
  });
});
