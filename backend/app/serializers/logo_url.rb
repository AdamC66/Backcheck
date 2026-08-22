# Absolute URLs, because a separately-hosted frontend can't resolve a relative one.
# Proxy rather than redirect URLs: they're stable and CDN-cacheable, where a redirect
# hands out a signed service URL that can expire inside an already-cached JSON response.
module LogoUrl
  def logo_url(record)
    return nil unless record.logo.attached?

    Rails.application.routes.url_helpers.rails_storage_proxy_url(record.logo)
  end
end
