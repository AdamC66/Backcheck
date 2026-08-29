require "rails_helper"

RSpec.describe LeagueGoalieSearch do
  let(:league) { create(:league, slug: "nhl") }
  let(:season) { create(:season, league: league, label: "2023-24") }
  let(:team) { create(:team, league: league) }

  def params(overrides = {})
    ActionController::Parameters.new({ league: "nhl", season: "2023-24" }.merge(overrides))
  end

  it "sums stints per goalie and computes save percentage and GAA" do
    starter = create(:player, last_name: "Wall", position: Player::POSITIONS[:goalie])
    create(:goalie_season_stat, player: starter, season: season, team: team,
           games_played: 50, shots_against: 1500, saves: 1380, goals_against: 120, time_on_ice_seconds: 180_000)

    row = described_class.new(params).rows.first

    expect(row[:games_played]).to eq(50)
    expect(row[:save_pctg]).to be_within(0.001).of(0.92)
    expect(row[:goals_against_average]).to be_within(0.01).of(2.4)
  end

  it "rejects an unknown sort column" do
    create(:goalie_season_stat, season: season, team: team)

    expect { described_class.new(params(sort: "nonsense")).rows }.to raise_error(Sortable::InvalidSort)
  end
end
