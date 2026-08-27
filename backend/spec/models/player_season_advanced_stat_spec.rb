require "rails_helper"

RSpec.describe PlayerSeasonAdvancedStat, type: :model do
  it "is valid with a player, a same-league team, a season, and an as_of_game in that season" do
    expect(build(:player_season_advanced_stat)).to be_valid
  end

  it "rejects a team from a different league than the season" do
    stat = build(:player_season_advanced_stat, team: create(:team))

    expect(stat).not_to be_valid
    expect(stat.errors[:team]).to include("must belong to the same league as the season")
  end

  it "rejects an as_of_game from a different season" do
    game = create(:game)
    other_season = create(:season, league: game.season.league)

    stat = build(:player_season_advanced_stat, as_of_game: game, season: other_season, team: game.home_team)

    expect(stat).not_to be_valid
    expect(stat.errors[:as_of_game]).to include("must belong to the given season")
  end

  it "allows the same player to hold separate chains per strength state in one season" do
    existing = create(:player_season_advanced_stat, strength_state: PlayerGameAdvancedStat::STRENGTH_STATES[:all])

    five_v_five = build(:player_season_advanced_stat, player: existing.player, season: existing.season,
                        team: existing.team, as_of_game: existing.as_of_game,
                        strength_state: PlayerGameAdvancedStat::STRENGTH_STATES[:five_v_five])

    expect(five_v_five).to be_valid
  end

  it "rejects a duplicate strength_state at the same as_of_game for the same player" do
    existing = create(:player_season_advanced_stat)

    dup = build(:player_season_advanced_stat, player: existing.player, season: existing.season,
                team: existing.team, as_of_game: existing.as_of_game, strength_state: existing.strength_state)

    expect(dup).not_to be_valid
  end

  it "allows the same chain point to hold separate rows per score state" do
    existing = create(:player_season_advanced_stat, score_state: PlayerGameAdvancedStat::SCORE_STATES[:all])

    close = build(:player_season_advanced_stat, player: existing.player, season: existing.season,
                  team: existing.team, as_of_game: existing.as_of_game, strength_state: existing.strength_state,
                  score_state: PlayerGameAdvancedStat::SCORE_STATES[:close])

    expect(close).to be_valid
  end

  it "rejects a duplicate score_state at the same chain point" do
    existing = create(:player_season_advanced_stat)

    dup = build(:player_season_advanced_stat, player: existing.player, season: existing.season,
                team: existing.team, as_of_game: existing.as_of_game, strength_state: existing.strength_state,
                score_state: existing.score_state)

    expect(dup).not_to be_valid
  end

  it "rejects a game_type that doesn't match as_of_game's own game_type" do
    stat = build(:player_season_advanced_stat, game_type: Game::GAME_TYPES[:playoffs])

    expect(stat).not_to be_valid
    expect(stat.errors[:game_type]).to include("must match as_of_game's game_type")
  end

  it "allows the same player to hold separate chains per game_type in one season" do
    season = create(:season)
    team = create(:team, league: season.league)
    player = create(:player)
    regular_game = create(:game, season: season, home_team: team, game_type: Game::GAME_TYPES[:regular_season])
    playoff_game = create(:game, season: season, home_team: team, game_type: Game::GAME_TYPES[:playoffs])
    create(:player_season_advanced_stat, player: player, season: season, team: team, as_of_game: regular_game,
           game_type: Game::GAME_TYPES[:regular_season])

    playoff_stat = build(:player_season_advanced_stat, player: player, season: season, team: team,
                         as_of_game: playoff_game, game_type: Game::GAME_TYPES[:playoffs])

    expect(playoff_stat).to be_valid
  end
end
