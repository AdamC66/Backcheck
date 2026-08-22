# Attaches a logo file from the repo's `data/` directory to a record.
#
# Seeds run repeatedly, and attaching unconditionally would replace the blob every time,
# orphaning the old one. Comparing checksums means a rerun is a no-op unless the artwork
# actually changed — Active Storage's checksum is a base64 MD5 of the file.
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
