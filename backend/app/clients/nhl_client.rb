# The API publishes no rate limit and sends no rate-limit headers, so the interval below
# is a self-imposed floor rather than a measured one. Call it from jobs only.
class NhlClient < BaseApiClient
  BASE_URL = "https://api-web.nhle.com".freeze
  MAX_REDIRECTS = 3

  TooManyRedirects = Class.new(Error)

  def standings_season
    get("/v1/standings-season")
  end

  def standings_on(date)
    get("/v1/standings/#{date.to_fs(:iso8601)}")
  end

  def club_schedule_season(team_abbreviation, nhl_season_id)
    get("/v1/club-schedule-season/#{team_abbreviation}/#{nhl_season_id}")
  end

  def scores_on(date)
    get("/v1/score/#{date.to_fs(:iso8601)}")
  end

  def boxscore(nhl_game_id)
    get("/v1/gamecenter/#{nhl_game_id}/boxscore")
  end

  def play_by_play(nhl_game_id)
    get("/v1/gamecenter/#{nhl_game_id}/play-by-play")
  end

  def player_landing(nhl_player_id)
    get("/v1/player/#{nhl_player_id}/landing")
  end

  # The only endpoint here that redirects: "current" is an alias for whichever season is
  # presently in effect, and its 307 has no body — the resolved season is the one thing
  # worth keeping from the hop, since it's otherwise thrown away.
  def roster(team_abbreviation)
    response, resolved_path = get_following_redirects("/v1/roster/#{team_abbreviation}/current")
    season_id = resolved_path[%r{/roster/[^/]+/(\d+)\z}, 1]&.to_i

    parse(response, resolved_path).merge("season_id" => season_id)
  end

  private

  def min_interval_env_var
    "NHL_API_MIN_INTERVAL"
  end

  # Its own retry loop (via with_retries), separate from #get's — each hop of a
  # redirect chain gets a fresh attempt budget rather than sharing one across all of them.
  def get_following_redirects(path, hop: 0)
    response = with_retries { perform(path) }

    if response.is_a?(Net::HTTPRedirection)
      raise TooManyRedirects, "redirect loop for #{path}" if hop >= MAX_REDIRECTS

      return get_following_redirects(URI(response["location"]).request_uri, hop: hop + 1)
    end

    [ response, path ]
  end
end
