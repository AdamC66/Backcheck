import { describe, expect, it } from "vitest";
import { gameFor, TEAMS } from "@/test-mocks";
import { groupByMonth, teamGame } from "../teamSchedule";

const [ducks, bruins] = TEAMS;

describe("teamGame", () => {
  it("reads the game from the given team's side", () => {
    const entry = teamGame(gameFor(), ducks.id);

    expect(entry).toMatchObject({
      opponent: bruins,
      isHome: true,
      teamScore: 5,
      opponentScore: 2,
      outcome: "win",
    });
  });

  it("counts a loss past regulation as its own outcome", () => {
    const overtime = gameFor({ last_period_type: "OT" });
    const shootout = gameFor({ last_period_type: "SO" });

    expect(teamGame(overtime, bruins.id).outcome).toBe("ot_loss");
    expect(teamGame(shootout, bruins.id).outcome).toBe("ot_loss");
    expect(teamGame(overtime, ducks.id).outcome).toBe("win");
  });
});

describe("groupByMonth", () => {
  it("groups consecutive games under a labelled month", () => {
    const months = groupByMonth(
      [
        gameFor({ id: 1, game_date: "2025-10-08" }),
        gameFor({ id: 2, game_date: "2025-10-30" }),
        gameFor({ id: 3, game_date: "2025-11-02" }),
      ],
      ducks.id,
    );

    expect(months.map((month) => month.key)).toEqual(["2025-10", "2025-11"]);
    expect(months[0].label).toMatch(/October 2025/);
    expect(months[0].games).toHaveLength(2);
    expect(months[1].games).toHaveLength(1);
  });
});
