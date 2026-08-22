# A dev server that quietly picks the next free port (5174 when 5173 is taken) is
# indistinguishable from a broken backend in the browser console, so local dev accepts
# any localhost port. Deployed environments must name their origins explicitly —
# FRONTEND_ORIGIN takes a comma-separated list.
configured_origins = ENV["FRONTEND_ORIGIN"].to_s.split(",").map(&:strip).reject(&:empty?)

allowed_origins =
  if configured_origins.any?
    configured_origins
  elsif Rails.env.local?
    [ %r{\Ahttps?://(localhost|127\.0\.0\.1)(:\d+)?\z} ]
  else
    []
  end

if allowed_origins.any?
  Rails.application.config.middleware.insert_before 0, Rack::Cors do
    allow do
      origins(*allowed_origins)
      resource "*",
        headers: :any,
        methods: [ :get, :post, :put, :patch, :delete, :options, :head ]
    end
  end
elsif Rails.env.production?
  Rails.logger.warn("FRONTEND_ORIGIN is unset — all cross-origin browser requests will be blocked.")
end
