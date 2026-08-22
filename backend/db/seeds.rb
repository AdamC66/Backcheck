# Idempotent — safe to run more than once.
[
  { key: "league_admin", label: "League Admin", scope_type: "league" },
  { key: "gm", label: "General Manager", scope_type: "team" },
  { key: "assistant_gm", label: "Assistant General Manager", scope_type: "team" },
  { key: "coaching_staff", label: "Coaching Staff", scope_type: "team" }
].each { |attrs| Role.find_or_create_by!(key: attrs[:key]) { |r| r.assign_attributes(attrs) } }

puts "Seeded #{Role.count} roles."

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
