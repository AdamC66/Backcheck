import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "../Select";

const OPTIONS = [
  { value: "nhl", label: "National Hockey League" },
  { value: "ahl", label: "American Hockey League" },
];

describe("Select", () => {
  it("associates its label and reports the chosen option", async () => {
    const handleChange = vi.fn();
    render(
      <Select id="league" label="League" options={OPTIONS} value="" onChange={handleChange} />,
    );

    await userEvent.selectOptions(screen.getByLabelText("League"), "ahl");

    expect(handleChange).toHaveBeenCalledOnce();
  });

  it("exposes an error message to assistive tech", () => {
    render(
      <Select
        id="league"
        label="League"
        options={OPTIONS}
        value=""
        error="League is required"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("League")).toHaveAccessibleDescription("League is required");
  });
});
