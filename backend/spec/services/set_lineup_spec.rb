require "rails_helper"

RSpec.describe SetLineup do
  let(:game) { create(:game, starts_at: 3.days.from_now) }
  let(:team) { game.home_team }

  def roster_player
    create(:player).tap { |player| create(:roster_spot, player: player, team: team, season: game.season) }
  end

  def params_for(attrs)
    ActionController::Parameters.new(attrs).permit!
  end

  it "builds a full lineup from the submitted structure" do
    forwards = Array.new(12) { roster_player }
    defense = Array.new(6) { roster_player }
    starter = roster_player

    result = described_class.new(team: team, game: game, params: params_for(
      forward_lines: forwards.each_slice(3).map { |line| line.map(&:id) },
      defense_pairs: defense.each_slice(2).map { |pair| pair.map(&:id) },
      power_play_units: [ forwards.first(5).map(&:id) ],
      penalty_kill_units: [ forwards.first(4).map(&:id) ],
      starting_goalie_id: starter.id,
      scratches: [ roster_player.id ]
    )).call

    expect(result).to be_success
    expect(result.lineup.slots.forward_line.count).to eq(12)
    expect(result.lineup.slots.power_play.count).to eq(5)
    expect(result.lineup.slots.goalie.sole.player).to eq(starter)
  end

  it "fails without persisting when a named player isn't on the team" do
    result = described_class.new(team: team, game: game, params: params_for(
      forward_lines: [ [ roster_player.id, create(:player).id, roster_player.id ] ]
    )).call

    expect(result).not_to be_success
    expect(Lineup.where(team: team, game: game)).not_to exist
  end
end
