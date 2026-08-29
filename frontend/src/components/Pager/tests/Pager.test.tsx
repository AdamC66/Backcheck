import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { Pager } from "../Pager";

describe("Pager", () => {
  it("renders nothing for a single page", () => {
    const { container } = render(<Pager page={1} totalPages={1} onPageChange={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("steps the page and disables the ends", async () => {
    const onPageChange = vi.fn();
    render(<Pager page={2} totalPages={3} totalCount={70} onPageChange={onPageChange} />);

    expect(screen.getByText("Page 2 of 3 · 70 total")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Prev" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
