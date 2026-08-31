FactoryBot.define do
  factory :lineup do
    game
    team { game.home_team }
  end
end
