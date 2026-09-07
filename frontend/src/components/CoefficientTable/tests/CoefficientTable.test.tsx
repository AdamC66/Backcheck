import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CoefficientTable } from "../CoefficientTable";

describe("CoefficientTable", () => {
  it("renders one row per coefficient, weights to 4 decimals", () => {
    render(<CoefficientTable coefficients={{ intercept: -1.1681552, distance: -0.03 }} />);

    expect(screen.getByText("intercept")).toBeInTheDocument();
    expect(screen.getByText("-1.1682")).toBeInTheDocument();
    expect(screen.getByText("-0.0300")).toBeInTheDocument();
  });

  it("renders nothing when there are no coefficients", () => {
    const { container } = render(<CoefficientTable coefficients={{}} />);

    expect(container).toBeEmptyDOMElement();
  });
});
