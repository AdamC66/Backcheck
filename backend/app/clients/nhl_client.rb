require "net/http"

# The API publishes no rate limit and sends no rate-limit headers, so the interval below
# is a self-imposed floor rather than a measured one. Call it from jobs only.
class NhlClient
  BASE_URL = "https://api-web.nhle.com".freeze
  USER_AGENT = "Backcheck/1.0 (hockey analytics dashboard; contact via repository)".freeze

  DEFAULT_MIN_INTERVAL = 1.0
  MAX_ATTEMPTS = 3
  MAX_REDIRECTS = 3
  OPEN_TIMEOUT = 5
  READ_TIMEOUT = 15

  Error = Class.new(StandardError)
  NotFound = Class.new(Error)
  RateLimited = Class.new(Error)
  ServerError = Class.new(Error)
  TransportError = Class.new(Error)
  TooManyRedirects = Class.new(Error)

  class << self
    # Shared process-wide, or each service keeps its own interval and they burst together.
    attr_accessor :last_request_at

    def mutex
      @mutex ||= Mutex.new
    end
  end

  def initialize(min_interval: nil)
    @min_interval = (min_interval || ENV.fetch("NHL_API_MIN_INTERVAL", DEFAULT_MIN_INTERVAL)).to_f
  end

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

  # The only endpoint here that redirects: "current" is an alias for whichever season is
  # presently in effect, and its 307 has no body — the resolved season is the one thing
  # worth keeping from the hop, since it's otherwise thrown away.
  def roster(team_abbreviation)
    response, resolved_path = get_following_redirects("/v1/roster/#{team_abbreviation}/current")
    season_id = resolved_path[%r{/roster/[^/]+/(\d+)\z}, 1]&.to_i

    parse(response, resolved_path).merge("season_id" => season_id)
  end

  private

  attr_reader :min_interval

  def get(path)
    attempt = 0

    begin
      attempt += 1
      throttle
      parse(perform(path), path)
    rescue RateLimited, ServerError, TransportError => e
      raise e if attempt >= MAX_ATTEMPTS

      sleep(2**attempt * min_interval)
      retry
    end
  end

  def get_following_redirects(path, attempt: 0, hop: 0)
    attempt += 1
    throttle
    response = perform(path)

    if response.is_a?(Net::HTTPRedirection)
      raise TooManyRedirects, "redirect loop for #{path}" if hop >= MAX_REDIRECTS

      return get_following_redirects(URI(response["location"]).request_uri, hop: hop + 1)
    end

    [ response, path ]
  rescue RateLimited, ServerError, TransportError => e
    raise e if attempt >= MAX_ATTEMPTS

    sleep(2**attempt * min_interval)
    retry
  end

  def perform(path)
    uri = URI.join(BASE_URL, path)

    Net::HTTP.start(uri.host, uri.port, use_ssl: true,
                    open_timeout: OPEN_TIMEOUT, read_timeout: READ_TIMEOUT) do |http|
      http.request(Net::HTTP::Get.new(uri, "User-Agent" => USER_AGENT, "Accept" => "application/json"))
    end
  rescue SocketError, SystemCallError, Net::OpenTimeout, Net::ReadTimeout => e
    raise TransportError, "#{e.class} requesting #{path}"
  end

  def parse(response, path)
    case response
    when Net::HTTPSuccess then JSON.parse(response.body)
    when Net::HTTPNotFound then raise NotFound, "404 for #{path}"
    when Net::HTTPTooManyRequests then raise RateLimited, "429 for #{path}"
    when Net::HTTPServerError then raise ServerError, "#{response.code} for #{path}"
    else raise Error, "#{response.code} for #{path}"
    end
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
