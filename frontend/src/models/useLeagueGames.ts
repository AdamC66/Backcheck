import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchLeagueGames, type LeagueGamesPage } from "@/models/games";
import { leagueGamesKey } from "@/models/queryKeys";

export function useLeagueGames(slug: string) {
  return useInfiniteQuery({
    queryKey: leagueGamesKey(slug),
    queryFn: ({ pageParam }) => fetchLeagueGames(slug, pageParam),
    initialPageParam: {} as LeagueGamesPage,
    // Cursors are the adjacent dates that have games, so paging skips the empty months
    // between seasons in one step rather than a day at a time.
    getNextPageParam: (lastPage): LeagueGamesPage | undefined => {
      const date = lastPage.meta?.next_cursor;

      return date === null || date === undefined ? undefined : { date, direction: "forward" };
    },
    getPreviousPageParam: (firstPage): LeagueGamesPage | undefined => {
      const date = firstPage.meta?.prev_cursor;

      return date === null || date === undefined ? undefined : { date, direction: "backward" };
    },
    enabled: slug.length > 0,
    retry: false,
  });
}
