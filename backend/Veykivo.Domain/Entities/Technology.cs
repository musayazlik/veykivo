using Veykivo.Domain.Enums;

namespace Veykivo.Domain.Entities;

public class Technology : IVersionedEntity
{
    public Guid Version { get; set; } = Guid.NewGuid();
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public required string Name { get; set; }
    public TechnologyCategory Category { get; set; }
    public string? Icon { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }
}
