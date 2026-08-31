FactoryBot.define do
  factory :lineup_slot do
    association :lineup, strategy: :create
    unit_type { :forward_line }
    unit_number { 1 }
    slot_order { 0 }

    player do
      create(:player).tap do |player|
        create(:roster_spot, player: player, team: lineup.team, season: lineup.game.season)
      end
    end
  end
end
