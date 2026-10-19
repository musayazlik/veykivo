using Veykivo.Domain.Enums;

namespace Veykivo.Domain.Entities;

public class Post : IVersionedEntity
{
    public Guid Version { get; set; } = Guid.NewGuid();
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public required string Slug { get; set; }
    public required string Title { get; set; }
    public required string Excerpt { get; set; }
    public string BodyMarkdown { get; set; } = string.Empty;
    public Guid? CoverImageId { get; set; }
    public MediaAsset? CoverImage { get; set; }
    public Guid? CategoryId { get; set; }
    public Category? Category { get; set; }
    public List<PostTag> Tags { get; set; } = [];
    public List<Comment> Comments { get; set; } = [];
    public bool IsFeatured { get; set; }
    public string? AuthorName { get; set; }

    /// <summary>Published + gelecekteki PublishedAt "planlı yayın" anlamına gelir; zamanı gelince kendiliğinden görünür.</summary>
    public PostStatus Status { get; set; } = PostStatus.Draft;
    public DateTimeOffset? PublishedAt { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public bool IsScheduled(DateTimeOffset now) => Status == PostStatus.Published && PublishedAt > now;

    /// <summary>Ortalama 200 kelime/dk okuma hızına göre tahmini süre.</summary>
    public static int EstimateReadingMinutes(string markdown)
    {
        var words = markdown.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;
        return Math.Max(1, (int)Math.Ceiling(words / 200.0));
    }
}

public class Category
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public string? Description { get; set; }
    /// <summary>#RRGGBB biçiminde vurgu rengi; listelerde nokta ve rozet olarak kullanılır.</summary>
    public string Color { get; set; } = "#2F6F6A";
    public List<Post> Posts { get; set; } = [];
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class Tag
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public List<PostTag> Posts { get; set; } = [];
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class PostTag
{
    public Guid PostId { get; set; }
    public Post Post { get; set; } = null!;
    public Guid TagId { get; set; }
    public Tag Tag { get; set; } = null!;
}

/// <summary>Ziyaretçi yorumu. Moderasyondan geçmeden yayınlanmaz; yalnızca tek seviye yanıt desteklenir.</summary>
public class Comment
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid PostId { get; set; }
    public Post Post { get; set; } = null!;
    public Guid? ParentId { get; set; }
    public Comment? Parent { get; set; }
    public List<Comment> Replies { get; set; } = [];
    public required string AuthorName { get; set; }
    /// <summary>Yalnızca panelde görünür; sitede yayınlanmaz.</summary>
    public string? AuthorEmail { get; set; }
    public required string Body { get; set; }
    public CommentStatus Status { get; set; } = CommentStatus.Pending;
    /// <summary>Panelden yazılan ekip yanıtı; sitede rozetle gösterilir.</summary>
    public bool IsStaffReply { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
