import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "../ToastProvider";
import { useToast } from "../useToast";

function ShowToastButton({ message }: { message: string }) {
  const { showToast } = useToast();

  return (
    <button type="button" onClick={() => showToast(message, "error")}>
      Trigger
    </button>
  );
}

describe("ToastProvider / useToast", () => {
  it("shows a toast when showToast is called, and lets it be dismissed", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ShowToastButton message="Something went wrong" />
      </ToastProvider>,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");

    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
