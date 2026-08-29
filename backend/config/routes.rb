Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # Solid Queue's own dashboard — a separate HTML UI, so it sits outside /api/v1.
  # Gated by HTTP Basic auth, see config/initializers/mission_control.rb.
  mount MissionControl::Jobs::Engine, at: "/jobs"

  namespace :api do
    namespace :v1 do
      get "health", to: "health#show"
      get "me", to: "current_user#show"
      post "login", to: "sessions#create"
      delete "logout", to: "sessions#destroy"

      resources :leagues, only: [ :index, :show ], param: :slug do
        resources :standings, only: [ :index ]
        resources :games, only: [ :index ], controller: "league_games"
        resources :seasons, only: [ :index ]
      end

      resources :games, only: [ :show ]

      resources :players, only: [ :show ]

      resources :teams, only: [ :show ] do
        resources :games, only: [ :index ], controller: "team_games"
        resource :roster, only: [ :show ], controller: "team_roster"
        resource :stats, only: [ :show ], controller: "team_stats"
        resources :roster_statuses, only: [ :update ], param: :player_id
        resources :reassignments, only: [ :update ], param: :player_id
        resources :affiliations, only: [ :index ], controller: "team_affiliations"
      end

      resources :roster_statuses, only: [ :index ]

      namespace :admin do
        resources :sync_runs, only: [ :index, :show, :create ] do
          member do
            post :cancel
          end
        end
        resources :sync_kinds, only: [ :index ]
        get "roadmap", to: "roadmap#show"
      end
    end
  end
end
