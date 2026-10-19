using Microsoft.EntityFrameworkCore;
using Veykivo.Domain.Entities;

namespace Veykivo.Application.Abstractions;

public interface IAppDbContext
{
    DbSet<Service> Services { get; }
    DbSet<Project> Projects { get; }
    DbSet<ProjectTechnology> ProjectTechnologies { get; }
    DbSet<Technology> Technologies { get; }
    DbSet<TeamMember> TeamMembers { get; }
    DbSet<Post> Posts { get; }
    DbSet<MediaAsset> MediaAssets { get; }
    DbSet<Inquiry> Inquiries { get; }
    DbSet<SiteSetting> SiteSettings { get; }
    DbSet<PendingFileDeletion> PendingFileDeletions { get; }
    DbSet<Category> Categories { get; }
    DbSet<Tag> Tags { get; }
    DbSet<PostTag> PostTags { get; }
    DbSet<Comment> Comments { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

/// <summary>Görsel depolama soyutlaması. MVP'de yerel disk; üretimde S3 uyumlu adaptör takılır.</summary>
public interface IFileStorage
{
    Task<StoredFile> SaveAsync(Stream content, string extension, string mimeType, CancellationToken ct);
    Task DeleteAsync(string storageKey, CancellationToken ct);
}

public sealed record StoredFile(string StorageKey, string Url);

public interface IEmailSender
{
    Task SendAsync(string to, string subject, string textBody, CancellationToken ct);
}
