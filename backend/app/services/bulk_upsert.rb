# Validates every row in Ruby except uniqueness (the DB's unique index backs that
# instead) and writes every valid one in one bulk upsert, not one query each (TASK-103).
class BulkUpsert
  attr_reader :failures

  def initialize(model:, unique_by:)
    @model = model
    @unique_by = unique_by
    @rows = []
    @failures = []
  end

  # Returns whether the record was valid (and so will be written by #call) — callers
  # that need to report only the rows actually persisted filter on this.
  def add(record)
    if record.valid?(:bulk_upsert)
      rows << record.attributes.except("id", "created_at", "updated_at")
      true
    else
      failures << "#{record.class.name} #{record.attributes.slice(*unique_by.map(&:to_s))}: " \
                   "#{record.errors.full_messages.join(', ')}"
      false
    end
  end

  def call
    return [] if rows.empty?

    model.upsert_all(rows, unique_by: unique_by, record_timestamps: true)
  end

  private

  attr_reader :model, :unique_by, :rows
end
