import type { Game } from "@/models/games";
import type { Team } from "@/models/teams";

export type GameOutcome = "win" | "loss" | "ot_loss";

export interface TeamGame {
  game: Game;
  opponent: Team;
  isHome: boolean;
  teamScore: number | null;
  opponentScore: number | null;
  outcome: GameOutcome | null;
}

export interface GameMonth {
  key: string;
  label: string;
  games: TeamGame[];
}

const FINISHED_STATES = ["FINAL", "OFF"];
const EXTRA_TIME = ["OT", "SO"];

export function teamGame(game: Game, teamId: number): TeamGame {
  const isHome = game.home.team.id === teamId;
  const side = isHome ? game.home : game.away;
  const other = isHome ? game.away : game.home;

  return {
    game,
    opponent: other.team,
    isHome,
    teamScore: side.score,
    opponentScore: other.score,
    outcome: outcomeFor(game, side.score, other.score),
  };
}

// A loss past regulation is its own outcome: it's the point in the standings that
// separates 82-0-0 from 41-0-41.
function outcomeFor(game: Game, teamScore: number | null, opponentScore: number | null) {
  if (!FINISHED_STATES.includes(game.state) || teamScore === null || opponentScore === null) {
    return null;
  }

  if (teamScore > opponentScore) return "win";

  return EXTRA_TIME.includes(game.last_period_type ?? "") ? "ot_loss" : "loss";
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

// Most-recent-first: the game right before today reads first, like a box score ticker.
export function recentTeamGames(
  games: Game[],
  teamId: number,
  count = 3,
  today = new Date(),
): TeamGame[] {
  const cutoff = isoDate(today);

  return games
    .filter((game) => FINISHED_STATES.includes(game.state) && game.game_date <= cutoff)
    .sort((a, b) => b.game_date.localeCompare(a.game_date))
    .slice(0, count)
    .map((game) => teamGame(game, teamId));
}

// Soonest-first, the way an actual schedule reads.
export function upcomingTeamGames(
  games: Game[],
  teamId: number,
  count = 3,
  today = new Date(),
): TeamGame[] {
  const cutoff = isoDate(today);

  return games
    .filter((game) => !FINISHED_STATES.includes(game.state) && game.game_date >= cutoff)
    .sort((a, b) => a.game_date.localeCompare(b.game_date))
    .slice(0, count)
    .map((game) => teamGame(game, teamId));
}

export function groupByMonth(games: Game[], teamId: number): GameMonth[] {
  return games.reduce<GameMonth[]>((months, game) => {
    const key = game.game_date.slice(0, 7);
    const existing = months.at(-1);
    const entry = teamGame(game, teamId);

    if (existing?.key === key) {
      existing.games.push(entry);
    } else {
      months.push({ key, label: monthLabel(game.game_date), games: [entry] });
    }

    return months;
  }, []);
}

function monthLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}
