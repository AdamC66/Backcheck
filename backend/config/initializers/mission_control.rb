# HTTP Basic auth in front of Mission Control (see routes.rb) — same ENV-var-with-a-
# dev-default pattern as JWT_SECRET, rather than Rails encrypted credentials, since
# every other secret in this app already follows that pattern.
MissionControl::Jobs.http_basic_auth_user = ENV.fetch("MISSION_CONTROL_USER", "admin")
MissionControl::Jobs.http_basic_auth_password = ENV.fetch("MISSION_CONTROL_PASSWORD", "dev-secret-change-me")
