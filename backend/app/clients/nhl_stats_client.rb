# Shift-chart data lives on a different host/REST shape than NhlClient (api-web.nhle.com)
# — confirmed live, not assumed. Same self-imposed rate limit as NhlClient; jobs only.
class NhlStatsClient < BaseApiClient
  BASE_URL = "https://api.nhle.com".freeze

  # typeCode 505 rows are goal-marker noise (duplicates of play-by-play's own goal
  # events), not real shifts — returned as-is; callers filter, same as HockeyTechClient's.
  def shift_chart(nhl_game_id)
    get("/stats/rest/en/shiftcharts", "cayenneExp" => "gameId=#{nhl_game_id}").fetch("data")
  end

  private

  def min_interval_env_var
    "NHL_STATS_API_MIN_INTERVAL"
  end
end
