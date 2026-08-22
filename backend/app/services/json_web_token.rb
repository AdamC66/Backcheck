# Hand-rolled JWT issuance/verification — no auth gem. Chosen so the mechanism
# is fully understood rather than inherited from Devise magic (see docs/DECISIONS.md).
class JsonWebToken
  ALGORITHM = "HS256".freeze
  EXPIRATION = 24.hours

  def self.encode(user_id)
    payload = { user_id: user_id, exp: EXPIRATION.from_now.to_i }
    JWT.encode(payload, secret, ALGORITHM)
  end

  def self.decode(token)
    body = JWT.decode(token, secret, true, algorithm: ALGORITHM).first
    ActiveSupport::HashWithIndifferentAccess.new(body)
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end

  def self.secret
    ENV.fetch("JWT_SECRET") { Rails.application.secret_key_base }
  end
end
