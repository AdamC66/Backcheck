require "rails_helper"

RSpec.describe UpsertGameStats do
  let(:game) { create(:game, nhl_game_id: 2024020204) }
  let(:payload) { JSON.parse(nhl_fixture("boxscore")) }

  before do
    create(:player, nhl_player_id: 8482705) # away forward, C. Sillinger
    create(:player, nhl_player_id: 8477970) # home goalie, V. Vanecek
  end

  def upsert
    described_class.new(game: game, payload: payload)
  end

  it "attributes each stat line to the team the player actually suited up for" do
    upsert.call

    skater = SkaterGameStat.find_by(player: Player.find_by(nhl_player_id: 8482705))
    expect(skater).to have_attributes(team: game.away_team, goals: 0, shots_on_goal: 1,
                                       time_on_ice_seconds: 1236, faceoff_winning_pctg: 0.6)

    goalie = GoalieGameStat.find_by(player: Player.find_by(nhl_player_id: 8477970))
    expect(goalie).to have_attributes(team: game.home_team, saves: 49, shots_against: 50,
                                       goals_against: 1, decision: "W", starter: true,
                                       time_on_ice_seconds: 3783)
  end

  it "reports playerIds with no matching Player instead of raising" do
    result = upsert
    result.call

    expect(result.missing_players).not_to be_empty
  end
end
