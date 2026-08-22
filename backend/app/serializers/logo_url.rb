# Proxy rather than redirect URLs: a redirect's signed service URL can expire inside an
# already-cached JSON response.
module LogoUrl
  def logo_url(record)
    return nil unless record.logo.attached?

    Rails.application.routes.url_helpers.rails_storage_proxy_url(record.logo)
  end
end
