import { toIsoDate } from "@/lib/format";
import type { Game } from "@/models/games";

export interface GameDay {
  date: string;
  games: Game[];
}

// The date a ticker should open on: the latest one that has already happened, so a live
// season opens on today and an off-season one on the last games played.
export function openingDate(days: GameDay[], today = toIsoDate(new Date())) {
  return days.findLast((day) => day.date <= today)?.date ?? days[0]?.date;
}

export function groupByDate(games: Game[]): GameDay[] {
  return games.reduce<GameDay[]>((days, game) => {
    const last = days.at(-1);

    if (last?.date === game.game_date) {
      last.games.push(game);
    } else {
      days.push({ date: game.game_date, games: [game] });
    }

    return days;
  }, []);
}
