require "net/http"

# The only thing in the app that talks to the NHL. Nothing calls it from a request —
# ingestion runs in jobs (see docs/DECISIONS.md).
#
# The API publishes no rate limit and returns no rate-limit headers, so the interval
# between requests is self-imposed rather than negotiated. Treat it as a courtesy floor,
# not a measured ceiling.
class NhlClient
  BASE_URL = "https://api-web.nhle.com".freeze
  USER_AGENT = "Backcheck/1.0 (hockey analytics dashboard; contact via repository)".freeze

  DEFAULT_MIN_INTERVAL = 1.0
  MAX_ATTEMPTS = 3
  OPEN_TIMEOUT = 5
  READ_TIMEOUT = 15

  Error = Class.new(StandardError)
  NotFound = Class.new(Error)
  RateLimited = Class.new(Error)
  ServerError = Class.new(Error)
  TransportError = Class.new(Error)

  class << self
    # Shared across every instance in the process so that separate services can't each
    # keep their own private interval and collectively burst.
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
