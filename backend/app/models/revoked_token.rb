# A stateless JWT stays cryptographically valid until it expires, so logout has to
# record the token's jti here and every authenticated request has to check it.
class RevokedToken < ApplicationRecord
  validates :jti, presence: true, uniqueness: true
  validates :expires_at, presence: true

  def self.revoked?(jti)
    exists?(jti: jti)
  end

  # A row stops mattering once the token would have expired on its own.
  def self.purge_expired!
    where(expires_at: ..Time.current).delete_all
  end
end
