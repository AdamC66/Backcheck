require "rails_helper"

RSpec.describe RevokedToken do
  it "reports whether a jti has been revoked" do
    create(:revoked_token, jti: "known-jti")

    expect(described_class.revoked?("known-jti")).to be(true)
    expect(described_class.revoked?("other-jti")).to be(false)
  end

  it "purges only rows whose token would already have expired" do
    stale = create(:revoked_token, expires_at: 1.hour.ago)
    live = create(:revoked_token, expires_at: 1.hour.from_now)

    described_class.purge_expired!

    expect(described_class.exists?(stale.id)).to be(false)
    expect(described_class.exists?(live.id)).to be(true)
  end
end
