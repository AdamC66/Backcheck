# Checksum-guarded because seeds rerun: attaching unconditionally replaces the blob every
# time and orphans the old one.
class AttachLogo
  def initialize(record, path)
    @record = record
    @path = Pathname(path)
  end

  def call
    return :missing unless path.exist?
    return :unchanged if matches_attached?

    record.logo.attach(io: path.open, filename: path.basename.to_s, content_type: content_type)

    :attached
  end

  private

  attr_reader :record, :path

  def matches_attached?
    record.logo.attached? && record.logo.blob.checksum == Digest::MD5.base64digest(path.read)
  end

  def content_type
    Marcel::MimeType.for(path, name: path.basename.to_s)
  end
end
