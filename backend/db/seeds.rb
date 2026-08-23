# Idempotent — safe to run more than once.
[
  { key: "league_admin", label: "League Admin", scope_type: "league" },
  { key: "gm", label: "General Manager", scope_type: "team" },
  { key: "assistant_gm", label: "Assistant General Manager", scope_type: "team" },
  { key: "coaching_staff", label: "Coaching Staff", scope_type: "team" }
].each { |attrs| Role.find_or_create_by!(key: attrs[:key]) { |r| r.assign_attributes(attrs) } }

puts "Seeded #{Role.count} roles."

[
  { slug: "nhl", name: "National Hockey League", abbreviation: "NHL", tier: 1 },
  { slug: "ahl", name: "American Hockey League", abbreviation: "AHL", tier: 2 },
  { slug: "echl", name: "ECHL", abbreviation: "ECHL", tier: 3 }
].each do |attrs|
  league = League.find_or_initialize_by(slug: attrs[:slug])
  league.update!(attrs)

  AttachLogo.new(league, ImportTeams::MANIFEST_ROOT.join("#{league.abbreviation}.svg")).call
end

puts "Seeded #{League.count} leagues."

League.ranked.each do |league|
  import = ImportTeams.new(league)
  teams = import.call

  puts "Seeded #{teams.size} #{league.abbreviation} teams."
  puts "  WARNING: no logo file for #{import.missing_logos.join(', ')}" if import.missing_logos.any?
end

# Affiliations describe a minor-league team's NHL parent, so there's nothing to import
# for the NHL league's own manifest.
League.ranked.reject { |league| league.slug == "nhl" }.each do |league|
  import = ImportTeamAffiliations.new(league)
  affiliations = import.call

  if import.season.blank?
    puts "  Skipped #{league.abbreviation} affiliations: no NHL season yet — run rake nhl:backfill, then re-seed."
    next
  end

  puts "Seeded #{affiliations.size} #{league.abbreviation} affiliations (#{import.season.label})."
  puts "  WARNING: no team match for #{import.missing_teams.join(', ')}" if import.missing_teams.any?
end

# There is no account-creation endpoint yet, so the one Super Admin is seeded.
if Rails.env.production? && !ENV.key?("SUPER_ADMIN_PASSWORD")
  raise "Refusing to seed a default-password Super Admin in production — set SUPER_ADMIN_PASSWORD."
end

admin_email = ENV.fetch("SUPER_ADMIN_EMAIL", "admin@example.com")
admin_password = ENV.fetch("SUPER_ADMIN_PASSWORD", "password123")

admin = User.find_or_initialize_by(email: admin_email)
admin.password = admin_password if admin.new_record?
admin.is_super_admin = true
admin.save!

puts "Super Admin: #{admin.email}"
