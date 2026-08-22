# Every JSON response goes through here so the `data`/`error` envelope stays identical
# across endpoints instead of being re-hand-rolled per controller (see docs/DECISIONS.md).
module ApiResponses
  extend ActiveSupport::Concern

  private

  def render_data(payload, status: :ok, meta: nil)
    body = { data: payload }
    body[:meta] = meta if meta

    render json: body, status: status
  end

  def render_error(code:, message:, status:, details: nil)
    error = { code: code, message: message }
    error[:details] = details if details

    render json: { error: error }, status: status
  end
end
