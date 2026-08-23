# Headshots are never stored — both upstreams expose a stable, derivable URL, unlike the
# per-season NHL asset path (…/20262027/TOR/…) which rots on every trade.
module PlayerImages
  NHL_HEADSHOT = "https://assets.nhle.com/mugs/nhl/latest/%<id>s.png".freeze
  HOCKEYTECH_HEADSHOT = "https://assets.leaguestat.com/%<league>s/240x240/%<id>s.jpg".freeze

  def headshot_url(player)
    return format(NHL_HEADSHOT, id: player.nhl_player_id) if player.nhl_player_id.present?

    external = player.external_ids.detect { |id| id.source.start_with?("hockeytech_") }
    return nil if external.nil?

    format(HOCKEYTECH_HEADSHOT, league: external.source.delete_prefix("hockeytech_"), id: external.external_id)
  end
end
