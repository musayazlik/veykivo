namespace Veykivo.Domain.Entities;

public class TeamMember : IVersionedEntity
{
    public Guid Version { get; set; } = Guid.NewGuid();
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public required string Name { get; set; }
    public required string RoleTitle { get; set; }
    public string Bio { get; set; } = string.Empty;
    public Guid? PhotoId { get; set; }
    public MediaAsset? Photo { get; set; }
    public string? LinkedInUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }
}
