using Microsoft.EntityFrameworkCore;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Common;
using Veykivo.Application.Contracts;
using Veykivo.Domain.Entities;
using Veykivo.Domain.Enums;

namespace Veykivo.Application.Services;

/// <summary>Ziyaretçiye açık okuma işlemleri. Yalnızca yayındaki içerikleri döndürür.</summary>
public sealed class PublicContentService(IAppDbContext db, TimeProvider clock, CommentService commentService)
{
    public async Task<IReadOnlyList<ServiceListItemDto>> GetServicesAsync(CancellationToken ct) =>
        await db.Services.AsNoTracking()
            .Where(s => s.IsPublished)
            .OrderBy(s => s.SortOrder).ThenBy(s => s.Title)
            .Select(s => new ServiceListItemDto(s.Slug, s.Title, s.Summary, s.Icon,
                s.CoverImage == null ? null : new MediaDto(s.CoverImage.Id, s.CoverImage.Url, s.CoverImage.AltText)))
            .ToListAsync(ct);

    public async Task<ServiceDetailDto> GetServiceAsync(string slug, CancellationToken ct) =>
        await db.Services.AsNoTracking()
            .Where(s => s.IsPublished && s.Slug == slug)
            .Select(s => new ServiceDetailDto(s.Slug, s.Title, s.Summary, s.Body, s.Icon,
                s.CoverImage == null ? null : new MediaDto(s.CoverImage.Id, s.CoverImage.Url, s.CoverImage.AltText),
                s.SeoTitle, s.SeoDescription, s.UpdatedAt))
            .FirstOrDefaultAsync(ct)
        ?? throw new NotFoundException("Hizmet bulunamadı.");

    public async Task<IReadOnlyList<ProjectListItemDto>> GetProjectsAsync(bool? featured, int? limit, CancellationToken ct)
    {
        var query = db.Projects.AsNoTracking().Where(p => p.IsPublished);
        if (featured == true) query = query.Where(p => p.IsFeatured);

        query = query.OrderBy(p => p.SortOrder).ThenByDescending(p => p.PublishedAt);
        query = query.Take(limit is > 0 ? Math.Min(limit.Value, 50) : 50);

        return await query
            .Select(p => new ProjectListItemDto(p.Slug, p.Title, p.ClientName, p.Sector, p.Summary,
                p.CoverImage == null ? null : new MediaDto(p.CoverImage.Id, p.CoverImage.Url, p.CoverImage.AltText),
                p.IsFeatured, p.PublishedAt,
                p.Technologies.Where(t => t.Technology.IsPublished)
                    .OrderBy(t => t.Technology.SortOrder).Select(t => t.Technology.Name).ToList()))
            .ToListAsync(ct);
    }

    public async Task<ProjectDetailDto> GetProjectAsync(string slug, CancellationToken ct) =>
        await db.Projects.AsNoTracking()
            .Where(p => p.IsPublished && p.Slug == slug)
            .Select(p => new ProjectDetailDto(p.Slug, p.Title, p.ClientName, p.Sector, p.Summary,
                p.Challenge, p.Solution, p.Outcome,
                p.CoverImage == null ? null : new MediaDto(p.CoverImage.Id, p.CoverImage.Url, p.CoverImage.AltText),
                p.PublishedAt,
                p.Technologies.Where(t => t.Technology.IsPublished).OrderBy(t => t.Technology.SortOrder)
                    .Select(t => new TechnologyDto(t.Technology.Id, t.Technology.Name, t.Technology.Category, t.Technology.Icon))
                    .ToList(),
                p.SeoTitle, p.SeoDescription, p.UpdatedAt))
            .FirstOrDefaultAsync(ct)
        ?? throw new NotFoundException("Proje bulunamadı.");

    public async Task<IReadOnlyList<TeamMemberDto>> GetTeamAsync(CancellationToken ct) =>
        await db.TeamMembers.AsNoTracking()
            .Where(m => m.IsPublished)
            .OrderBy(m => m.SortOrder).ThenBy(m => m.Name)
            .Select(m => new TeamMemberDto(m.Id, m.Name, m.RoleTitle, m.Bio,
                m.Photo == null ? null : new MediaDto(m.Photo.Id, m.Photo.Url, m.Photo.AltText), m.LinkedInUrl))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<TechnologyDto>> GetTechnologiesAsync(CancellationToken ct) =>
        await db.Technologies.AsNoTracking()
            .Where(t => t.IsPublished)
            .OrderBy(t => t.Category).ThenBy(t => t.SortOrder).ThenBy(t => t.Name)
            .Select(t => new TechnologyDto(t.Id, t.Name, t.Category, t.Icon))
            .ToListAsync(ct);

    private IQueryable<Post> VisiblePosts()
    {
        var now = clock.GetUtcNow();
        return db.Posts.AsNoTracking()
            .Where(p => p.Status == PostStatus.Published && p.PublishedAt != null && p.PublishedAt <= now);
    }

    public async Task<PagedResult<PostListItemDto>> GetPostsAsync(
        int page, int pageSize, string? category, string? tag, string? q, bool? featured, CancellationToken ct)
    {
        var pagination = Pagination.Create(page, pageSize, 50);
        page = pagination.Page;
        pageSize = pagination.PageSize;

        var query = VisiblePosts();
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(p => p.Category != null && p.Category.Slug == category);
        if (!string.IsNullOrWhiteSpace(tag)) query = query.Where(p => p.Tags.Any(t => t.Tag.Slug == tag));
        if (featured == true) query = query.Where(p => p.IsFeatured);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(p => p.Title.ToLower().Contains(term) || p.Excerpt.ToLower().Contains(term));
        }

        var total = await query.CountAsync(ct);
        var rows = await query
            .OrderByDescending(p => p.PublishedAt)
            .Skip(pagination.Offset).Take(pageSize)
            .Select(p => new
            {
                p.Slug, p.Title, p.Excerpt, p.PublishedAt, p.BodyMarkdown, p.IsFeatured,
                Cover = p.CoverImage == null ? null : new MediaDto(p.CoverImage.Id, p.CoverImage.Url, p.CoverImage.AltText),
                Category = p.Category == null ? null : new CategoryRefDto(p.Category.Name, p.Category.Slug, p.Category.Color),
                Tags = p.Tags.OrderBy(t => t.Tag.Name).Select(t => new TagRefDto(t.Tag.Name, t.Tag.Slug)).ToList(),
            })
            .ToListAsync(ct);

        var items = rows.Select(p => new PostListItemDto(p.Slug, p.Title, p.Excerpt, p.Cover, p.PublishedAt!.Value,
            Post.EstimateReadingMinutes(p.BodyMarkdown), p.Category, p.Tags, p.IsFeatured)).ToList();
        return new PagedResult<PostListItemDto>(items, page, pageSize, total);
    }

    public async Task<PostDetailDto> GetPostAsync(string slug, CancellationToken ct)
    {
        var p = await VisiblePosts()
                    .Include(x => x.CoverImage)
                    .Include(x => x.Category)
                    .Include(x => x.Tags).ThenInclude(t => t.Tag)
                    .FirstOrDefaultAsync(x => x.Slug == slug, ct)
                ?? throw new NotFoundException("Yazı bulunamadı.");

        var comments = await commentService.GetApprovedThreadAsync(p.Id, ct);
        return new PostDetailDto(p.Slug, p.Title, p.Excerpt, p.BodyMarkdown,
            p.CoverImage == null ? null : new MediaDto(p.CoverImage.Id, p.CoverImage.Url, p.CoverImage.AltText),
            p.PublishedAt!.Value, Post.EstimateReadingMinutes(p.BodyMarkdown), p.SeoTitle, p.SeoDescription, p.UpdatedAt,
            p.Category == null ? null : new CategoryRefDto(p.Category.Name, p.Category.Slug, p.Category.Color),
            p.Tags.Select(t => new TagRefDto(t.Tag.Name, t.Tag.Slug)).OrderBy(t => t.Name).ToList(),
            p.AuthorName,
            comments,
            comments.Sum(c => 1 + c.Replies.Count));
    }

    /// <summary>Yayında yazısı olan kategoriler, yazı sayılarıyla.</summary>
    public async Task<IReadOnlyList<BlogCategoryDto>> GetBlogCategoriesAsync(CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        // Filtre SQL'de çalışsın diye önce anonim tipe projekte edilir, DTO'ya bellekte çevrilir.
        var rows = await db.Categories.AsNoTracking()
            .Select(c => new
            {
                c.Name, c.Slug, c.Color, c.Description,
                Count = c.Posts.Count(p => p.Status == PostStatus.Published && p.PublishedAt != null && p.PublishedAt <= now),
            })
            .Where(c => c.Count > 0)
            .OrderByDescending(c => c.Count).ThenBy(c => c.Name)
            .ToListAsync(ct);
        return rows.Select(c => new BlogCategoryDto(c.Name, c.Slug, c.Color, c.Description, c.Count)).ToList();
    }

    /// <summary>Yayında yazısı olan etiketler, yazı sayılarıyla.</summary>
    public async Task<IReadOnlyList<BlogTagDto>> GetBlogTagsAsync(CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var rows = await db.Tags.AsNoTracking()
            .Select(t => new
            {
                t.Name, t.Slug,
                Count = t.Posts.Count(p => p.Post.Status == PostStatus.Published && p.Post.PublishedAt != null && p.Post.PublishedAt <= now),
            })
            .Where(t => t.Count > 0)
            .OrderByDescending(t => t.Count).ThenBy(t => t.Name)
            .ToListAsync(ct);
        return rows.Select(t => new BlogTagDto(t.Name, t.Slug, t.Count)).ToList();
    }

    public async Task<IReadOnlyDictionary<string, string>> GetPublicSettingsAsync(CancellationToken ct)
    {
        var keys = SiteSettingKeys.Public.ToArray();
        return await db.SiteSettings.AsNoTracking()
            .Where(s => keys.Contains(s.Key))
            .ToDictionaryAsync(s => s.Key, s => s.Value, ct);
    }

    /// <summary>Next.js sitemap.xml üretimi için tüm yayındaki slug'lar.</summary>
    public async Task<IReadOnlyList<SitemapEntryDto>> GetSitemapAsync(CancellationToken ct)
    {
        var services = await db.Services.AsNoTracking().Where(s => s.IsPublished)
            .Select(s => new SitemapEntryDto("service", s.Slug, s.UpdatedAt)).ToListAsync(ct);
        var projects = await db.Projects.AsNoTracking().Where(p => p.IsPublished)
            .Select(p => new SitemapEntryDto("project", p.Slug, p.UpdatedAt)).ToListAsync(ct);
        var posts = await VisiblePosts()
            .Select(p => new SitemapEntryDto("post", p.Slug, p.UpdatedAt)).ToListAsync(ct);
        var categories = (await GetBlogCategoriesAsync(ct)).Select(c => new SitemapEntryDto("category", c.Slug, clock.GetUtcNow()));
        return [.. services, .. projects, .. posts, .. categories];
    }
}
