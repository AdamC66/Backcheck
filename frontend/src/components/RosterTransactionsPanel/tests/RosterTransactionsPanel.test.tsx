import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RosterTransactionsPanel } from "../RosterTransactionsPanel";
import { rosterTransactionFor } from "@/test-mocks";

describe("RosterTransactionsPanel", () => {
  it("lists each transaction with its status and date range", () => {
    render(
      <RosterTransactionsPanel
        transactions={[
          rosterTransactionFor({ player_name: "Teddy Blueger", status: "injured_reserve" }),
        ]}
        meta={{ page: 1, per_page: 25, total_count: 1, total_pages: 1 }}
        isLoading={false}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Teddy Blueger")).toBeInTheDocument();
    expect(screen.getByText("IR")).toBeInTheDocument();
    expect(screen.getByText(/ongoing/)).toBeInTheDocument();
  });

  it("shows an empty state when there are no transactions", () => {
    render(
      <RosterTransactionsPanel
        transactions={[]}
        meta={{ page: 1, per_page: 25, total_count: 0, total_pages: 0 }}
        isLoading={false}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText("No moves recorded this season.")).toBeInTheDocument();
  });

  it("calls onPageChange when Next is clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <RosterTransactionsPanel
        transactions={[rosterTransactionFor()]}
        meta={{ page: 1, per_page: 25, total_count: 50, total_pages: 2 }}
        isLoading={false}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
