require "net/http"

# Shift-chart data lives on a different host/REST shape than NhlClient (api-web.nhle.com)
# — confirmed live, not assumed. Same self-imposed rate limit as NhlClient; jobs only.
class NhlStatsClient
  BASE_URL = "https://api.nhle.com".freeze
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
    # Shared process-wide, or each service keeps its own interval and they burst together.
    attr_accessor :last_request_at

    def mutex
      @mutex ||= Mutex.new
    end
  end

  def initialize(min_interval: nil)
    @min_interval = (min_interval || ENV.fetch("NHL_STATS_API_MIN_INTERVAL", DEFAULT_MIN_INTERVAL)).to_f
  end

  # typeCode 505 rows are goal-marker noise (duplicates of play-by-play's own goal
  # events), not real shifts — returned as-is; callers filter, same as HockeyTechClient's.
  def shift_chart(nhl_game_id)
    get("/stats/rest/en/shiftcharts", "cayenneExp" => "gameId=#{nhl_game_id}").fetch("data")
  end

  private

  attr_reader :min_interval

  def get(path, params = {})
    attempt = 0

    begin
      attempt += 1
      throttle
      parse(perform(path, params), path)
    rescue RateLimited, ServerError, TransportError => e
      raise e if attempt >= MAX_ATTEMPTS

      sleep(2**attempt * min_interval)
      retry
    end
  end

  def perform(path, params)
    uri = URI.join(BASE_URL, path)
    uri.query = URI.encode_www_form(params) if params.present?

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
