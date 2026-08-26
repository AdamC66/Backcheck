class SyncRunItemSerializer
  STATUS_NAMES = SyncRun::STATUSES.invert.freeze

  def initialize(item)
    @item = item
  end

  def as_json(*)
    {
      id: item.id,
      kind: item.kind_name.to_s,
      team_id: item.team_id,
      team_name: item.team&.name,
      status: STATUS_NAMES.fetch(item.status).to_s,
      started_at: item.started_at,
      finished_at: item.finished_at,
      error_message: item.error_message
    }
  end

  private

  attr_reader :item
end
