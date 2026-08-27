require "rails_helper"

RSpec.describe UpsertGameStats do
  let(:game) { create(:game, nhl_game_id: 2024020204) }
  let(:payload) { JSON.parse(nhl_fixture("boxscore")) }
  let(:client) { unthrottled_client }

  # Every playerId the boxscore fixture references, so these specs are about stat
  # attribution, not accidentally exercising self-healing.
  before do
    [ 8482705, 8481161, 8480193, 8478007, 8484227, 8481567, 8478406, 8477970 ].each do |id|
      create(:player, nhl_player_id: id)
    end
  end

  def upsert
    described_class.new(game: game, payload: payload, client: client)
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

  it "derives a goalie's own goals/assists from game_events, since the boxscore never carries them" do
    goalie_player = Player.find_by(nhl_player_id: 8477970)
    create(:game_event, game: game, team: game.home_team, event_type: GameEvent::EVENT_TYPES[:goal],
           primary_player: goalie_player)

    upsert.call

    expect(GoalieGameStat.find_by(player: goalie_player)).to have_attributes(goals: 1, assists: 0)
  end

  it "self-heals an unknown playerId via player_landing instead of skipping the stat row" do
    Player.find_by(nhl_player_id: 8484227).destroy
    stub_nhl("/v1/player/8484227/landing", body: nhl_fixture("player_landing").sub("8484158", "8484227"))

    result = upsert
    result.call

    player = Player.find_by(nhl_player_id: 8484227)
    expect(player).to have_attributes(first_name: "Easton", last_name: "Cowan",
                                       position: Player::POSITIONS[:right_wing])
    expect(SkaterGameStat.find_by(player: player, game: game)).to be_present

    spot = RosterSpot.find_by(player: player, team: game.home_team, season: game.season)
    expect(spot).to have_attributes(contract_level: RosterSpot::CONTRACT_LEVELS[:unknown],
                                     contract_level_inferred: true,
                                     source: RosterSpot::SOURCES[:inferred_from_stats])
    expect(result.missing_players).to be_empty
  end

  it "only reports missing_players when the landing lookup itself can't resolve the id" do
    Player.find_by(nhl_player_id: 8484227).destroy
    stub_nhl("/v1/player/8484227/landing", status: 404, body: "{}")

    result = upsert
    result.call

    expect(result.missing_players).to contain_exactly(8484227)
    expect(Player.find_by(nhl_player_id: 8484227)).to be_nil
  end
end
