namespace Veykivo.Domain.Entities;

public class Project : IVersionedEntity
{
    public Guid Version { get; set; } = Guid.NewGuid();
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public required string Slug { get; set; }
    public required string Title { get; set; }
    public string? ClientName { get; set; }
    public string? Sector { get; set; }
    public required string Summary { get; set; }
    public string Challenge { get; set; } = string.Empty;
    public string Solution { get; set; } = string.Empty;
    public string Outcome { get; set; } = string.Empty;
    public Guid? CoverImageId { get; set; }
    public MediaAsset? CoverImage { get; set; }
    public bool IsPublished { get; set; }
    public bool IsFeatured { get; set; }
    public int SortOrder { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public List<ProjectTechnology> Technologies { get; set; } = [];

    /// <summary>Yayın tarihi ilk yayında bir kez atanır; tekrar yayına almak tarihi değiştirmez.</summary>
    public void SetPublished(bool isPublished, DateTimeOffset now)
    {
        IsPublished = isPublished;
        if (isPublished && PublishedAt is null)
            PublishedAt = now;
    }
}

public class ProjectTechnology
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public Guid TechnologyId { get; set; }
    public Technology Technology { get; set; } = null!;
}
