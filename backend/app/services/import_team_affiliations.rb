# Reads the same manifest ImportTeams does — the nhl_affiliate field it leaves alone.
# Only meaningful for a non-NHL league's manifest; the NHL's own carries no such field.
class ImportTeamAffiliations
  MANIFEST_ROOT = ImportTeams::MANIFEST_ROOT

  attr_reader :missing_teams

  def initialize(league, manifest_path: nil)
    @league = league
    @manifest_path = Pathname(manifest_path || MANIFEST_ROOT.join("#{league.slug}-teams", "teams.json"))
    @missing_teams = []
  end

  def call
    return [] unless manifest_path.exist?
    return [] if season.blank?

    entries.filter_map { |entry| link(entry) }
  end

  # The manifest carries no season of its own, so affiliations anchor to the newest NHL
  # season on hand rather than Season.current — that scope is deliberately empty between
  # seasons, which would leave affiliations unseeded all summer even after a backfill.
  def season
    @season ||= nhl_league&.seasons&.chronological&.last
  end

  private

  attr_reader :league, :manifest_path

  def nhl_league
    @nhl_league ||= League.find_by(slug: "nhl")
  end

  def entries
    JSON.parse(manifest_path.read, symbolize_names: true)
  end

  def link(entry)
    parent_abbreviation = entry[:nhl_affiliate]
    return if parent_abbreviation.blank?

    parent = nhl_league.teams.find_by(abbreviation: parent_abbreviation)
    affiliate = league.teams.find_by(abbreviation: entry.fetch(:abbreviation))

    if parent.blank? || affiliate.blank?
      missing_teams << entry.fetch(:abbreviation)
      return
    end

    affiliation = TeamAffiliation.find_or_initialize_by(affiliate_team: affiliate, season: season)
    affiliation.update!(parent_team: parent)
    affiliation
  end
end
