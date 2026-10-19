namespace Veykivo.Domain.Entities;

/// <summary>Medya kaydıyla aynı transaction içinde yazılan, tekrar denenebilir dosya silme işi.</summary>
public sealed class PendingFileDeletion
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public required string StorageKey { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
