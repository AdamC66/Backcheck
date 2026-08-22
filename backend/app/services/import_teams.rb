# Keyed on abbreviation so a corrected manifest can just be re-seeded. The manifests'
# `nhl_affiliate` field is ignored until TeamAffiliation exists.
class ImportTeams
  MANIFEST_ROOT = Rails.root.join("..", "data")

  class MissingManifest < StandardError; end

  attr_reader :missing_logos

  def initialize(league, manifest_path: nil)
    @league = league
    @manifest_path = Pathname(manifest_path || MANIFEST_ROOT.join("#{league.slug}-teams", "teams.json"))
    @missing_logos = []
  end

  def call
    raise MissingManifest, "No team manifest at #{manifest_path}" unless manifest_path.exist?

    entries.map { |entry| upsert(entry) }
  end

  private

  attr_reader :league, :manifest_path

  def entries
    JSON.parse(manifest_path.read, symbolize_names: true)
  end

  def logos_dir
    manifest_path.dirname.join("logos")
  end

  def upsert(entry)
    colors = entry.fetch(:colors, {})
    team = league.teams.find_or_initialize_by(abbreviation: entry.fetch(:abbreviation))

    team.update!(
      name: entry.fetch(:name),
      primary_color: colors[:primary],
      secondary_color: colors[:secondary],
      tertiary_color: colors[:tertiary]
    )

    attach_logo(team, entry[:logo])

    team
  end

  def attach_logo(team, filename)
    return if filename.blank?

    result = AttachLogo.new(team, logos_dir.join(filename)).call
    missing_logos << filename if result == :missing
  end
end
