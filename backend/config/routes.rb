Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      get "health", to: "health#show"
      get "me", to: "current_user#show"
      post "login", to: "sessions#create"
      delete "logout", to: "sessions#destroy"

      resources :leagues, only: [ :index, :show ], param: :slug
    end
  end
end
