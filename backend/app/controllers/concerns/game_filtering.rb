module GameFiltering
  extend ActiveSupport::Concern

  private

  # Returns the requested range, or nil after rendering a 422. `max_days` bounds how much
  # one request can pull; nil leaves it unbounded for team-sized results.
  def requested_range(fallback:, to_fallback: nil, max_days: nil)
    from = date_param(:from) { fallback }
    to = date_param(:to) { to_fallback || from }

    return if performed?
    return render_invalid_range("to must not be earlier than from") if to < from

    if max_days && (to - from).to_i >= max_days
      return render_invalid_range("range must be #{max_days} days or fewer")
    end

    from..to
  end

  # An absent param falls back; a malformed one is an error rather than a silent default.
  def date_param(name)
    value = params[name]
    return yield if value.blank?

    Date.iso8601(value)
  rescue Date::Error
    render_invalid_range("#{name} must be a YYYY-MM-DD date")
  end

  def render_invalid_range(message)
    render_error(code: "invalid_range", message: message, status: :unprocessable_content)

    nil
  end

  def filter_game_type(scope)
    params[:game_type] == "regular_season" ? scope.regular_season : scope
  end
end
