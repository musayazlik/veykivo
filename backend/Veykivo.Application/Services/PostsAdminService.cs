using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Common;
using Veykivo.Application.Contracts;
using Veykivo.Domain.Entities;
using Veykivo.Domain.Enums;
using static Veykivo.Application.Services.ContentRules;

namespace Veykivo.Application.Services;

public sealed class PostsAdminService(IAppDbContext db, TimeProvider clock, IValidator<UpsertPostRequest> validator)
{
    private static AdminPostDto ToDto(Post p) => new(p.Id, p.Slug, p.Title, p.Excerpt, p.BodyMarkdown, p.CoverImageId,
        Media(p.CoverImage), p.Status, p.PublishedAt, p.SeoTitle, p.SeoDescription, p.UpdatedAt,
        p.CategoryId, p.Tags.Select(t => t.TagId).ToList(), p.IsFeatured, p.AuthorName, p.Version);

    public async Task<IReadOnlyList<AdminPostListItemDto>> ListPostsAsync(CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        return await db.Posts.AsNoTracking()
            .OrderByDescending(p => p.UpdatedAt)
            .Select(p => new AdminPostListItemDto(
                p.Id, p.Slug, p.Title,
                p.CoverImage == null ? null : new MediaDto(p.CoverImage.Id, p.CoverImage.Url, p.CoverImage.AltText),
                p.Status, p.Status == PostStatus.Published && p.PublishedAt > now, p.PublishedAt, p.IsFeatured,
                p.CategoryId,
                p.Category == null ? null : new CategoryRefDto(p.Category.Name, p.Category.Slug, p.Category.Color),
                p.Tags.OrderBy(t => t.Tag.Name).Select(t => new TagRefDto(t.Tag.Name, t.Tag.Slug)).ToList(),
                p.Comments.Count, p.Comments.Count(c => c.Status == CommentStatus.Pending), p.UpdatedAt, p.Version))
            .ToListAsync(ct);
    }

    public async Task<AdminPostDto> GetPostAsync(Guid id, CancellationToken ct) =>
        ToDto(await db.Posts.AsNoTracking().Include(p => p.CoverImage).Include(p => p.Tags)
                  .FirstOrDefaultAsync(p => p.Id == id, ct)
              ?? throw new NotFoundException("Yazı bulunamadı."));

    public async Task<AdminPostDto> SavePostAsync(Guid? id, UpsertPostRequest r, string? authorName, CancellationToken ct)
    {
        await validator.ValidateAndThrowAsync(r, ct);
        var slug = ResolveSlug(r.Slug, r.Title);
        if (await db.Posts.AnyAsync(p => p.Slug == slug && p.Id != id, ct))
            throw new ConflictException($"'{slug}' slug'ı başka bir yazıda kullanılıyor.");
        await EnsureMediaExistsAsync(db, r.CoverImageId, ct);

        if (r.CategoryId is { } categoryId && !await db.Categories.AnyAsync(c => c.Id == categoryId, ct))
            throw new BadRequestException("Seçilen kategori bulunamadı.");
        var tagIds = (r.TagIds ?? []).Distinct().ToList();
        if (tagIds.Count > 0 && await db.Tags.CountAsync(t => tagIds.Contains(t.Id), ct) != tagIds.Count)
            throw new BadRequestException("Seçilen etiketlerden biri bulunamadı.");

        Post entity;
        if (id is null)
        {
            entity = new Post { Slug = slug, Title = r.Title, Excerpt = r.Excerpt, AuthorName = authorName };
            db.Posts.Add(entity);
        }
        else
        {
            entity = await db.Posts.Include(p => p.Tags).FirstOrDefaultAsync(p => p.Id == id, ct)
                     ?? throw new NotFoundException("Yazı bulunamadı.");
            RequireVersion(entity, r.Version);
        }

        var now = clock.GetUtcNow();
        entity.Slug = slug;
        entity.Title = r.Title.Trim();
        entity.Excerpt = r.Excerpt.Trim();
        entity.BodyMarkdown = r.BodyMarkdown;
        entity.CoverImageId = r.CoverImageId;
        entity.CategoryId = r.CategoryId;
        entity.IsFeatured = r.IsFeatured;
        entity.SeoTitle = r.SeoTitle;
        entity.SeoDescription = r.SeoDescription;
        ApplyStatus(entity, r.Status, r.PublishedAt, now);
        entity.UpdatedAt = now;

        entity.Tags.RemoveAll(t => !tagIds.Contains(t.TagId));
        foreach (var tagId in tagIds.Where(t => entity.Tags.All(x => x.TagId != t)))
            entity.Tags.Add(new PostTag { PostId = entity.Id, TagId = tagId });

        await db.SaveChangesAsync(ct);
        return await GetPostAsync(entity.Id, ct);
    }

    /// <summary>Listeden yayın durumu ve öne çıkarma için hızlı güncelleme; yayınlama kuralları aynen uygulanır.</summary>
    public async Task QuickUpdateAsync(Guid id, QuickUpdatePostRequest r, CancellationToken ct)
    {
        var entity = await db.Posts.Include(p => p.Tags).FirstOrDefaultAsync(p => p.Id == id, ct)
                     ?? throw new NotFoundException("Yazı bulunamadı.");
        RequireVersion(entity, r.Version);

        var now = clock.GetUtcNow();
        if (r.Status is { } status)
        {
            if (status == PostStatus.Published && (entity.CategoryId is null || entity.Tags.Count == 0))
                throw new BadRequestException("Yayınlamak için yazıya bir kategori ve en az bir etiket ekleyin.");
            ApplyStatus(entity, status, status == PostStatus.Published ? entity.PublishedAt : null, now);
        }
        if (r.IsFeatured is { } featured) entity.IsFeatured = featured;
        entity.UpdatedAt = now;
        await db.SaveChangesAsync(ct);
    }

    public async Task DeletePostAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.Posts.FindAsync([id], ct) ?? throw new NotFoundException("Yazı bulunamadı.");
        db.Posts.Remove(entity);
        await db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Taslak: yayın tarihi temizlenir. Yayın: tarih verilmezse ilk yayın tarihi korunur, yoksa şimdi.
    /// İleri bir tarih verilirse yazı o ana kadar "planlı" kalır.
    /// </summary>
    private static void ApplyStatus(Post entity, PostStatus status, DateTimeOffset? publishedAt, DateTimeOffset now)
    {
        entity.Status = status;
        entity.PublishedAt = status == PostStatus.Draft
            ? null
            : publishedAt?.ToUniversalTime() ?? entity.PublishedAt ?? now;
    }
}
