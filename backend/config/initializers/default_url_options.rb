# Serializers build absolute logo URLs (Active Storage proxy routes) outside of any
# request, so the route set needs a host of its own — in an API-only app nothing else
# sets one, and the failure is a boot-time-invisible 500 on the first serialized logo.
Rails.application.routes.default_url_options =
  if Rails.env.test?
    { host: "www.example.com" }
  elsif Rails.env.production?
    { host: ENV.fetch("APP_HOST", "localhost"), protocol: ENV.fetch("APP_PROTOCOL", "https") }
  else
    { host: ENV.fetch("APP_HOST", "localhost"), port: ENV.fetch("PORT", 3000) }
  end
