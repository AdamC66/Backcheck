require "net/http"

# Shared throttle/retry/error-handling for every external API client (TASK-100).
# A subclass supplies BASE_URL and its own endpoint methods, overriding path_for/
# request_params/parse_body only where its request shape differs from a bare GET.
class BaseApiClient
  MAX_ATTEMPTS = 3
  OPEN_TIMEOUT = 5
  READ_TIMEOUT = 15
  DEFAULT_MIN_INTERVAL = 0.5
  USER_AGENT = "Backcheck/1.0 (hockey analytics dashboard; contact via repository)".freeze

  Error = Class.new(StandardError)
  NotFound = Class.new(Error)
  RateLimited = Class.new(Error)
  ServerError = Class.new(Error)
  TransportError = Class.new(Error)

  class << self
    # Shared process-wide per subclass, or each service keeps its own interval and
    # they burst together — a subclass's own singleton class, not this one, holds it.
    attr_accessor :last_request_at

    def mutex
      @mutex ||= Mutex.new
    end
  end

  def initialize(min_interval: nil)
    @min_interval = (min_interval || ENV.fetch(min_interval_env_var, DEFAULT_MIN_INTERVAL)).to_f
  end

  private

  attr_reader :min_interval

  def get(endpoint, params = {})
    with_retries { parse(perform(endpoint, params), endpoint) }
  end

  def with_retries
    attempt = 0

    begin
      attempt += 1
      throttle
      yield
    rescue RateLimited, ServerError, TransportError => e
      raise e if attempt >= MAX_ATTEMPTS

      sleep(2**attempt * min_interval)
      retry
    end
  end

  # A fresh connection per request, not kept alive — the enforced throttle interval
  # already dwarfs one handshake's cost, so this is deferred until that changes.
  def perform(endpoint, params = {})
    uri = build_uri(endpoint, params)

    Net::HTTP.start(uri.host, uri.port, use_ssl: true,
                    open_timeout: OPEN_TIMEOUT, read_timeout: READ_TIMEOUT) do |http|
      http.request(Net::HTTP::Get.new(uri, "User-Agent" => USER_AGENT, "Accept" => "application/json"))
    end
  rescue SocketError, SystemCallError, Net::OpenTimeout, Net::ReadTimeout, OpenSSL::SSL::SSLError, EOFError => e
    raise TransportError, "#{e.class} requesting #{endpoint}"
  end

  def build_uri(endpoint, params)
    uri = URI.join(self.class::BASE_URL, path_for(endpoint))
    query = request_params(endpoint, params)
    uri.query = URI.encode_www_form(query) if query.present?
    uri
  end

  # Overridden where an endpoint identifier isn't literally the URL path
  # (HockeyTechClient's is a fixed path with the endpoint folded into params instead).
  def path_for(endpoint)
    endpoint
  end

  # Overridden to fold in params every request needs beyond what the caller passed
  # (HockeyTechClient's feed/key/client_code/fmt).
  def request_params(_endpoint, params)
    params
  end

  def parse(response, endpoint)
    case response
    when Net::HTTPSuccess then parse_body(response.body, endpoint)
    when Net::HTTPNotFound then raise NotFound, "404 for #{endpoint}"
    when Net::HTTPTooManyRequests then raise RateLimited, "429 for #{endpoint}"
    when Net::HTTPServerError then raise ServerError, "#{response.code} for #{endpoint}"
    else raise Error, "#{response.code} for #{endpoint}"
    end
  end

  # Overridden where a 200 isn't a guarantee of bare JSON (HockeyTechClient's).
  def parse_body(body, _endpoint)
    JSON.parse(body)
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

  def min_interval_env_var
    raise NotImplementedError, "#{self.class} must define #min_interval_env_var"
  end
end
