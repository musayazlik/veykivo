namespace Veykivo.Domain.Entities;

public class MediaAsset
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public required string StorageKey { get; set; }
    public required string Url { get; set; }
    public required string MimeType { get; set; }
    public long SizeBytes { get; set; }
    public string AltText { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
