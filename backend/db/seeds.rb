# Idempotent — safe to run more than once.
[
  { key: "league_admin", label: "League Admin", scope_type: "league" },
  { key: "gm", label: "General Manager", scope_type: "team" },
  { key: "assistant_gm", label: "Assistant General Manager", scope_type: "team" },
  { key: "coaching_staff", label: "Coaching Staff", scope_type: "team" }
].each { |attrs| Role.find_or_create_by!(key: attrs[:key]) { |r| r.assign_attributes(attrs) } }

puts "Seeded #{Role.count} roles."
