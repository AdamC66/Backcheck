import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { groupByDate } from "@/lib/gameDays";
import { LEAGUE_GAMES } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { GameTicker } from "../GameTicker";

const days = groupByDate(LEAGUE_GAMES.data);

function renderTicker(overrides: Partial<Parameters<typeof GameTicker>[0]> = {}) {
  const onReachStart = vi.fn();
  const onReachEnd = vi.fn();

  renderWithProviders(
    <GameTicker days={days} onReachStart={onReachStart} onReachEnd={onReachEnd} {...overrides} />,
  );

  return { onReachStart, onReachEnd };
}

// jsdom reports zero size for everything, so layout is stubbed. These numbers put the
// most recent date past the right edge — the case needing filler, which used to loop.
describe("opening alignment", () => {
  const CONTENT = 1000;
  const VIEWPORT = 400;
  const ANCHOR_OFFSET = 900;

  const isStrip = (element: Element) => element.classList.contains("overflow-x-auto");
  const original = Object.getOwnPropertyDescriptors(Element.prototype);

  beforeEach(() => {
    Object.defineProperty(Element.prototype, "clientWidth", {
      configurable: true,
      get(this: Element) {
        return isStrip(this) ? VIEWPORT : 0;
      },
    });

    Object.defineProperty(Element.prototype, "scrollWidth", {
      configurable: true,
      get(this: Element) {
        if (!isStrip(this)) return 0;
        const filler = this.querySelector<HTMLElement>("[data-filler]");

        return CONTENT + (filler === null ? 0 : parseFloat(filler.style.width));
      },
    });

    Object.defineProperty(Element.prototype, "getBoundingClientRect", {
      configurable: true,
      value(this: HTMLElement) {
        const left = this.dataset?.date === "2026-04-15" ? ANCHOR_OFFSET : 0;

        return { left, right: 0, top: 0, bottom: 0, width: 0, height: 0, x: left, y: 0 };
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(Element.prototype, "clientWidth", original.clientWidth);
    Object.defineProperty(Element.prototype, "scrollWidth", original.scrollWidth);
    Object.defineProperty(
      Element.prototype,
      "getBoundingClientRect",
      original.getBoundingClientRect,
    );
  });

  it("settles on a filler width instead of oscillating", () => {
    renderWithProviders(<GameTicker days={days} />);

    const filler = document.querySelector<HTMLElement>("[data-filler]");

    expect(filler?.style.width).toBe(`${ANCHOR_OFFSET + VIEWPORT - CONTENT}px`);
  });
});

describe("GameTicker", () => {
  it("puts each date inline ahead of that date's games", () => {
    renderTicker();

    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Apr 15")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "ANA" })).toHaveLength(2);
  });

  it("asks for more games once an arrow is pressed at the end of what's loaded", async () => {
    const { onReachStart, onReachEnd } = renderTicker({ hasEarlier: true, hasLater: true });

    await userEvent.click(screen.getByRole("button", { name: /earlier games/i }));
    expect(onReachStart).toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /later games/i }));
    expect(onReachEnd).toHaveBeenCalled();
  });

  it("disables an arrow with nothing left to reach that way", () => {
    renderTicker({ hasEarlier: true, hasLater: false });

    expect(screen.getByRole("button", { name: /earlier games/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /later games/i })).toBeDisabled();
  });
});
