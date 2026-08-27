require "rails_helper"

RSpec.describe SyncGameStats do
  let!(:game) { create(:game, nhl_game_id: 2024020204) }

  before do
    [ 8482705, 8481161, 8480193, 8478007, 8484227, 8481567, 8478406, 8477970 ].each do |id|
      create(:player, nhl_player_id: id)
    end
    stub_nhl("/v1/gamecenter/2024020204/boxscore", fixture: "boxscore")
  end

  def sync
    described_class.new(game: game, client: unthrottled_client).call
  end

  it "writes stat lines and recomputes each player's season rollup in one pass" do
    sync

    player = Player.find_by(nhl_player_id: 8482705)
    expect(SkaterGameStat.find_by(player: player, game: game)).to be_present
    expect(SkaterSeasonStat.find_by(player: player, team: game.away_team, season: game.season))
      .to have_attributes(games_played: 1, goals: 0)
  end
end
