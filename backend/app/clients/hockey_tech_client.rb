# Serves the AHL and ECHL's public stats feed — HockeyTech/LeagueStat, unrelated to the
# NHL API. No published docs, no rate limit, so the interval below is self-imposed the
# same way NhlClient's is. Call it from jobs only.
class HockeyTechClient < BaseApiClient
  BASE_URL = "https://lscluster.hockeytech.com".freeze

  # Public feed keys, read out of each league's own statview bundle:
  # lscluster.hockeytech.com/statview-1.4.1/js/client/{code}/base.r3.js
  KEYS = { "ahl" => "ccb91f29d6744675", "echl" => "2c2b89ea7345cae8" }.freeze

  InvalidResponse = Class.new(Error)

  def initialize(client_code, min_interval: nil)
    @client_code = client_code
    @key = KEYS.fetch(client_code) { raise ArgumentError, "unknown client_code #{client_code.inspect}" }
    super(min_interval: min_interval)
  end

  def seasons
    get("seasons").fetch("Seasons")
  end

  def teams(season_id:)
    get("teamsbyseason", season_id: season_id).fetch("Teamsbyseason")
  end

  # A blank team_id isn't rejected upstream — it silently returns every team's roster
  # concatenated together, so it's rejected here instead of shipped as a multi-megabyte
  # surprise. The result always ends with one extra element: a nested array of coaching
  # staff, not a player — callers filter to Hash entries, the client doesn't.
  def roster(team_id:, season_id:)
    raise ArgumentError, "team_id is required" if team_id.blank?

    get("roster", team_id: team_id, season_id: season_id).fetch("Roster")
  end

  private

  attr_reader :client_code, :key

  def min_interval_env_var
    "HOCKEYTECH_API_MIN_INTERVAL"
  end

  # Every view lives at the same path — the view itself is a query param, folded in
  # via request_params below, not part of the URL.
  def path_for(_view)
    "/feed/index.php"
  end

  def request_params(view, params)
    { feed: "modulekit", view: view, key: key, client_code: client_code, fmt: "json" }.merge(params)
  end

  # A 200 is not a guarantee of JSON: an invalid key returns a plain-text "Invalid key."
  # body, and some parameter errors return a numeric status line before the JSON starts.
  def parse_body(body, view)
    JSON.parse(body).fetch("SiteKit")
  rescue JSON::ParserError, KeyError
    raise InvalidResponse, "unparseable response for #{view}: #{body.truncate(200)}"
  end
end
