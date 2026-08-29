require "rails_helper"

RSpec.describe LeagueSkaterSearch do
  let(:league) { create(:league, slug: "nhl") }
  let(:season) { create(:season, league: league, label: "2023-24") }
  let(:oilers) { create(:team, league: league) }
  let(:kings) { create(:team, league: league) }

  def params(overrides = {})
    ActionController::Parameters.new({ league: "nhl", season: "2023-24" }.merge(overrides))
  end

  it "returns one row per player, summed across team stints, with a traded player as TOT" do
    mover = create(:player, last_name: "Mover", position: Player::POSITIONS[:center])
    create(:skater_season_stat, player: mover, season: season, team: oilers, games_played: 40, goals: 10, points: 25)
    create(:skater_season_stat, player: mover, season: season, team: kings, games_played: 30, goals: 8, points: 20)
    stayer = create(:player, last_name: "Stayer", position: Player::POSITIONS[:defense])
    create(:skater_season_stat, player: stayer, season: season, team: oilers, games_played: 82, goals: 5, points: 40)

    rows = described_class.new(params(sort: "points", dir: "desc")).rows

    expect(rows.size).to eq(2)
    mover_row = rows.find { |row| row[:player][:last_name] == "Mover" }
    expect(mover_row[:games_played]).to eq(70)
    expect(mover_row[:points]).to eq(45)
    expect(mover_row[:team]).to eq("TOT")
    expect(rows.find { |row| row[:player][:last_name] == "Stayer" }[:team]).to be_a(Hash)
  end

  it "filters by name search and by position" do
    create(:skater_season_stat, player: create(:player, last_name: "Findme", position: Player::POSITIONS[:center]),
           season: season, team: oilers)
    create(:skater_season_stat, player: create(:player, last_name: "Blueline", position: Player::POSITIONS[:defense]),
           season: season, team: oilers)

    expect(described_class.new(params(q: "findme")).rows.map { |row| row[:player][:last_name] }).to eq([ "Findme" ])
    expect(described_class.new(params(position: "defense")).rows.map { |row| row[:player][:last_name] }).to eq([ "Blueline" ])
  end

  it "sorts on an advanced column joined from the latest snapshot" do
    low = create(:player, last_name: "Low")
    high = create(:player, last_name: "High")
    [ low, high ].each { |player| create(:skater_season_stat, player: player, season: season, team: oilers) }
    game = create(:game, season: season, home_team: oilers, away_team: kings)
    create(:player_season_advanced_stat, player: low, season: season, as_of_game: game, team: oilers, corsi_for: 100)
    create(:player_season_advanced_stat, player: high, season: season, as_of_game: game, team: oilers, corsi_for: 400)

    rows = described_class.new(params(sort: "corsi_for", dir: "desc")).rows

    expect(rows.map { |row| row[:player][:last_name] }).to eq(%w[High Low])
    expect(rows.first[:corsi_for]).to eq(400)
  end

  it "rejects an unknown sort column" do
    create(:skater_season_stat, season: season, team: oilers)

    expect { described_class.new(params(sort: "nonsense")).rows }.to raise_error(Sortable::InvalidSort)
  end

  it "reports pagination meta matching the list convention" do
    create(:skater_season_stat, season: season, team: oilers)

    meta = described_class.new(params(per_page: 10)).meta

    expect(meta).to include(page: 1, per_page: 10, total_count: 1, total_pages: 1, season: "2023-24")
  end

  it "defaults to the newest season that has stats, not the newest season row" do
    with_stats = create(:season, league: league, label: "2021-22", starts_on: Date.new(2021, 10, 1),
                        ends_on: Date.new(2022, 4, 30))
    create(:season, league: league, label: "2022-23", starts_on: Date.new(2022, 10, 1),
           ends_on: Date.new(2023, 4, 30))
    create(:skater_season_stat, season: with_stats, team: oilers)

    result = described_class.new(ActionController::Parameters.new(league: "nhl"))

    expect(result.season.label).to eq("2021-22")
  end
end
