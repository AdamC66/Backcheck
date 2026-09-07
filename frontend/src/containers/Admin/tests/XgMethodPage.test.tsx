import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import { XgMethodPage } from "../XgMethodPage";

describe("XgMethodPage", () => {
  it("renders the method sections", () => {
    renderWithProviders(<XgMethodPage />);

    expect(screen.getByText("How the expected goals model works")).toBeInTheDocument();
    expect(screen.getByText("The model: logistic regression")).toBeInTheDocument();
    expect(screen.getByText(/p = 1 \/ \(1 \+ e\^\(-z\)\)/)).toBeInTheDocument();
  });
});
