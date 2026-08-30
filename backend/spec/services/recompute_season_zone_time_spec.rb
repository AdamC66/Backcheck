require "rails_helper"

RSpec.describe RecomputeSeasonZoneTime do
  let(:season) { create(:season) }
  let(:team) { create(:team, league: season.league) }
  let(:player) { create(:player) }

  def recompute
    described_class.new(player: player, team: team, season: season,
                        game_type: Game::GAME_TYPES[:regular_season]).call
  end

  it "sums a player's zone-time lines across every game for that team this season" do
    2.times do
      game = create(:game, season: season, home_team: team)
      create(:player_game_zone_time, player: player, game: game, team: team,
                                     offensive_seconds: 300, defensive_seconds: 200,
                                     offensive_starts: 4, on_the_fly_starts: 2)
    end

    recompute

    stat = PlayerSeasonZoneTime.find_by(player: player, team: team, season: season)
    expect(stat).to have_attributes(games_played: 2, offensive_seconds: 600, defensive_seconds: 400,
                                    offensive_starts: 8, on_the_fly_starts: 4)
  end

  it "clears the rollup once its underlying games are gone" do
    game = create(:game, season: season, home_team: team)
    create(:player_game_zone_time, player: player, game: game, team: team)
    recompute
    PlayerGameZoneTime.where(player: player, team: team).destroy_all

    recompute

    expect(PlayerSeasonZoneTime.find_by(player: player, team: team, season: season)).to be_nil
  end
end
