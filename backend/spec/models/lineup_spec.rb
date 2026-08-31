require "rails_helper"

RSpec.describe Lineup, type: :model do
  it "is valid for a team that plays in the game" do
    expect(build(:lineup)).to be_valid
  end

  it "rejects a team that doesn't play in the game" do
    game = create(:game)
    outsider = create(:team, league: game.season.league)

    lineup = build(:lineup, game: game, team: outsider)

    expect(lineup).not_to be_valid
    expect(lineup.errors[:team]).to be_present
  end

  it "is a draft before the game starts and historical once it has" do
    upcoming = create(:lineup, game: create(:game, starts_at: 2.days.from_now))
    played = create(:lineup, game: create(:game, starts_at: 2.days.ago))

    expect(upcoming).not_to be_historical
    expect(played).to be_historical
  end

  it "rejects a second starting goalie" do
    lineup = create(:lineup)

    2.times do
      goalie = create(:player)
      create(:roster_spot, player: goalie, team: lineup.team, season: lineup.game.season)
      lineup.slots.build(player: goalie, unit_type: :goalie, unit_number: 1)
    end

    expect(lineup).not_to be_valid
  end
end
