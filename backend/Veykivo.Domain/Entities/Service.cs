namespace Veykivo.Domain.Entities;

public class Service : IVersionedEntity
{
    public Guid Version { get; set; } = Guid.NewGuid();
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public required string Slug { get; set; }
    public required string Title { get; set; }
    public required string Summary { get; set; }
    public string Body { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public Guid? CoverImageId { get; set; }
    public MediaAsset? CoverImage { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
