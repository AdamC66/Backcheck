import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextInput } from "../TextInput";

describe("TextInput", () => {
  it("associates its label and reports what the user types", async () => {
    const handleChange = vi.fn();
    render(<TextInput id="email" label="Email" value="" onChange={handleChange} />);

    await userEvent.type(screen.getByLabelText("Email"), "a");

    expect(handleChange).toHaveBeenCalledOnce();
  });

  it("exposes an error message to assistive tech", () => {
    render(<TextInput id="email" label="Email" value="" error="Email is required" readOnly />);

    const input = screen.getByLabelText("Email");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Email is required");
  });
});
