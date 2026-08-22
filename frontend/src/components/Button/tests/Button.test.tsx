import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../Button";

describe("Button", () => {
  it("calls its handler when clicked", async () => {
    const handleClick = vi.fn();
    render(
      <Button type="button" onClick={handleClick}>
        Sign out
      </Button>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("does not fire while disabled", async () => {
    const handleClick = vi.fn();
    render(
      <Button type="button" onClick={handleClick} disabled>
        Sign in
      </Button>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(handleClick).not.toHaveBeenCalled();
  });
});
