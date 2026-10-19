namespace Veykivo.Domain.Entities;

public interface IVersionedEntity
{
    Guid Version { get; set; }
}
