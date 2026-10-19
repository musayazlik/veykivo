using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Common;
using Veykivo.Application.Contracts;
using Veykivo.Domain.Entities;

namespace Veykivo.Application.Services;

/// <summary>Blog kategorileri ve etiketleri. Silme işlemi yazıları silmez; ilişki kaldırılır.</summary>
public sealed class BlogTaxonomyService(
    IAppDbContext db,
    TimeProvider clock,
    IValidator<UpsertCategoryRequest> categoryValidator,
    IValidator<UpsertTagRequest> tagValidator)
{
    // ------------------------------------------------------------------ Kategoriler

    public async Task<IReadOnlyList<AdminCategoryDto>> ListCategoriesAsync(CancellationToken ct) =>
        await db.Categories.AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new AdminCategoryDto(c.Id, c.Name, c.Slug, c.Description, c.Color, c.Posts.Count, c.CreatedAt))
            .ToListAsync(ct);

    public async Task<AdminCategoryDto> SaveCategoryAsync(Guid? id, UpsertCategoryRequest r, CancellationToken ct)
    {
        await categoryValidator.ValidateAndThrowAsync(r, ct);
        var name = r.Name.Trim();
        if (await db.Categories.AnyAsync(c => c.Name.ToLower() == name.ToLower() && c.Id != id, ct))
            throw new ConflictException($"'{name}' adında bir kategori zaten var.");

        Category entity;
        if (id is null)
        {
            entity = new Category { Name = name, Slug = "" };
            db.Categories.Add(entity);
        }
        else
        {
            entity = await db.Categories.FindAsync([id], ct) ?? throw new NotFoundException("Kategori bulunamadı.");
        }

        entity.Slug = await ResolveSlugAsync(r.Slug, name, s => db.Categories.AnyAsync(c => c.Slug == s && c.Id != entity.Id, ct));
        entity.Name = name;
        entity.Description = string.IsNullOrWhiteSpace(r.Description) ? null : r.Description.Trim();
        entity.Color = r.Color.ToUpperInvariant();
        entity.UpdatedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);

        return await db.Categories.AsNoTracking().Where(c => c.Id == entity.Id)
            .Select(c => new AdminCategoryDto(c.Id, c.Name, c.Slug, c.Description, c.Color, c.Posts.Count, c.CreatedAt))
            .FirstAsync(ct);
    }

    public async Task DeleteCategoryAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.Categories.FindAsync([id], ct) ?? throw new NotFoundException("Kategori bulunamadı.");
        db.Categories.Remove(entity);
        await db.SaveChangesAsync(ct);
    }

    // ------------------------------------------------------------------ Etiketler

    public async Task<IReadOnlyList<AdminTagDto>> ListTagsAsync(CancellationToken ct) =>
        await db.Tags.AsNoTracking()
            .OrderBy(t => t.Name)
            .Select(t => new AdminTagDto(t.Id, t.Name, t.Slug, t.Posts.Count, t.CreatedAt))
            .ToListAsync(ct);

    public async Task<AdminTagDto> SaveTagAsync(Guid? id, UpsertTagRequest r, CancellationToken ct)
    {
        await tagValidator.ValidateAndThrowAsync(r, ct);
        var name = r.Name.Trim();

        // Aynı adla yeni etiket istenirse mevcut olanı döndür (editörden hızlı ekleme için idempotent).
        if (id is null && await db.Tags.AsNoTracking().FirstOrDefaultAsync(t => t.Name.ToLower() == name.ToLower(), ct) is { } existing)
            return new AdminTagDto(existing.Id, existing.Name, existing.Slug, await db.PostTags.CountAsync(p => p.TagId == existing.Id, ct), existing.CreatedAt);
        if (id is not null && await db.Tags.AnyAsync(t => t.Name.ToLower() == name.ToLower() && t.Id != id, ct))
            throw new ConflictException($"'{name}' adında bir etiket zaten var.");

        Tag entity;
        if (id is null)
        {
            entity = new Tag { Name = name, Slug = "" };
            db.Tags.Add(entity);
        }
        else
        {
            entity = await db.Tags.FindAsync([id], ct) ?? throw new NotFoundException("Etiket bulunamadı.");
        }

        entity.Slug = await ResolveSlugAsync(r.Slug, name, s => db.Tags.AnyAsync(t => t.Slug == s && t.Id != entity.Id, ct));
        entity.Name = name;
        await db.SaveChangesAsync(ct);

        return await db.Tags.AsNoTracking().Where(t => t.Id == entity.Id)
            .Select(t => new AdminTagDto(t.Id, t.Name, t.Slug, t.Posts.Count, t.CreatedAt))
            .FirstAsync(ct);
    }

    public async Task DeleteTagAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.Tags.FindAsync([id], ct) ?? throw new NotFoundException("Etiket bulunamadı.");
        db.Tags.Remove(entity);
        await db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Elle verilen slug çakışırsa hata verir; addan üretilen slug çakışırsa -2, -3… eklenir.
    /// </summary>
    private static async Task<string> ResolveSlugAsync(string? requested, string name, Func<string, Task<bool>> exists)
    {
        if (!string.IsNullOrWhiteSpace(requested))
        {
            var manual = requested.Trim();
            if (await exists(manual)) throw new ConflictException($"'{manual}' slug'ı kullanılıyor.");
            return manual;
        }

        var baseSlug = Slug.From(name);
        if (baseSlug.Length == 0) throw new BadRequestException("Addan geçerli bir slug üretilemedi.");
        var slug = baseSlug;
        for (var i = 2; await exists(slug); i++) slug = $"{baseSlug}-{i}";
        return slug;
    }
}
