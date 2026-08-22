# Serializers build absolute URLs outside any request. Without a host here, the first
# serialized logo 500s.
Rails.application.routes.default_url_options =
  if Rails.env.test?
    { host: "www.example.com" }
  elsif Rails.env.production?
    { host: ENV.fetch("APP_HOST", "localhost"), protocol: ENV.fetch("APP_PROTOCOL", "https") }
  else
    { host: ENV.fetch("APP_HOST", "localhost"), port: ENV.fetch("PORT", 3000) }
  end
