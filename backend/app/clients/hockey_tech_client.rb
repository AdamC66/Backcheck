require "net/http"

# Serves the AHL and ECHL's public stats feed — HockeyTech/LeagueStat, unrelated to the
# NHL API. No published docs, no rate limit, so the interval below is self-imposed the
# same way NhlClient's is. Call it from jobs only.
class HockeyTechClient
  BASE_URL = "https://lscluster.hockeytech.com".freeze
  USER_AGENT = "Backcheck/1.0 (hockey analytics dashboard; contact via repository)".freeze

  # Public feed keys, read out of each league's own statview bundle:
  # lscluster.hockeytech.com/statview-1.4.1/js/client/{code}/base.r3.js
  KEYS = { "ahl" => "ccb91f29d6744675", "echl" => "2c2b89ea7345cae8" }.freeze

  DEFAULT_MIN_INTERVAL = 0.5
  MAX_ATTEMPTS = 3
  OPEN_TIMEOUT = 5
  READ_TIMEOUT = 15

  Error = Class.new(StandardError)
  NotFound = Class.new(Error)
  RateLimited = Class.new(Error)
  ServerError = Class.new(Error)
  TransportError = Class.new(Error)
  InvalidResponse = Class.new(Error)

  class << self
    # Shared process-wide, or each service keeps its own interval and they burst together.
    attr_accessor :last_request_at

    def mutex
      @mutex ||= Mutex.new
    end
  end

  def initialize(client_code, min_interval: nil)
    @client_code = client_code
    @key = KEYS.fetch(client_code) { raise ArgumentError, "unknown client_code #{client_code.inspect}" }
    @min_interval = (min_interval || ENV.fetch("HOCKEYTECH_API_MIN_INTERVAL", DEFAULT_MIN_INTERVAL)).to_f
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

  attr_reader :client_code, :key, :min_interval

  def get(view, **params)
    attempt = 0

    begin
      attempt += 1
      throttle
      parse(perform(view, params), view)
    rescue RateLimited, ServerError, TransportError => e
      raise e if attempt >= MAX_ATTEMPTS

      sleep(2**attempt * min_interval)
      retry
    end
  end

  def perform(view, params)
    query = { feed: "modulekit", view: view, key: key, client_code: client_code, fmt: "json" }.merge(params)
    uri = URI.join(BASE_URL, "/feed/index.php")
    uri.query = URI.encode_www_form(query)

    Net::HTTP.start(uri.host, uri.port, use_ssl: true,
                    open_timeout: OPEN_TIMEOUT, read_timeout: READ_TIMEOUT) do |http|
      http.request(Net::HTTP::Get.new(uri, "User-Agent" => USER_AGENT, "Accept" => "application/json"))
    end
  rescue SocketError, SystemCallError, Net::OpenTimeout, Net::ReadTimeout => e
    raise TransportError, "#{e.class} requesting #{view}"
  end

  def parse(response, view)
    case response
    when Net::HTTPSuccess then parse_body(response.body, view)
    when Net::HTTPNotFound then raise NotFound, "404 for #{view}"
    when Net::HTTPTooManyRequests then raise RateLimited, "429 for #{view}"
    when Net::HTTPServerError then raise ServerError, "#{response.code} for #{view}"
    else raise Error, "#{response.code} for #{view}"
    end
  end

  # A 200 is not a guarantee of JSON: an invalid key returns a plain-text "Invalid key."
  # body, and some parameter errors return a numeric status line before the JSON starts.
  def parse_body(body, view)
    JSON.parse(body).fetch("SiteKit")
  rescue JSON::ParserError, KeyError
    raise InvalidResponse, "unparseable response for #{view}: #{body.truncate(200)}"
  end

  def throttle
    self.class.mutex.synchronize do
      previous = self.class.last_request_at
      wait = previous ? min_interval - (monotonic_now - previous) : 0

      sleep(wait) if wait.positive?
      self.class.last_request_at = monotonic_now
    end
  end

  # Monotonic, so a clock adjustment mid-backfill can't collapse the interval.
  def monotonic_now
    Process.clock_gettime(Process::CLOCK_MONOTONIC)
  end
end
