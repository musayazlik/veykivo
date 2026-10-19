using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Common;
using Veykivo.Application.Contracts;
using Veykivo.Domain.Entities;
using Veykivo.Domain.Enums;
using static Veykivo.Application.Services.ContentRules;

namespace Veykivo.Application.Services;

public sealed class ServicesAdminService(IAppDbContext db, TimeProvider clock, IValidator<UpsertServiceRequest> validator)
{
    // ------------------------------------------------------------------ Services

    private static AdminServiceDto ToDto(Service s) => new(s.Id, s.Slug, s.Title, s.Summary, s.Body, s.Icon,
        s.CoverImageId, Media(s.CoverImage), s.SortOrder, s.IsPublished, s.SeoTitle, s.SeoDescription, s.UpdatedAt, s.Version);

    public async Task<IReadOnlyList<AdminServiceDto>> ListServicesAsync(CancellationToken ct) =>
        (await db.Services.AsNoTracking().Include(s => s.CoverImage).OrderBy(s => s.SortOrder).ThenBy(s => s.Title)
            .ToListAsync(ct)).Select(ToDto).ToList();

    public async Task<AdminServiceDto> GetServiceAsync(Guid id, CancellationToken ct) =>
        ToDto(await db.Services.AsNoTracking().Include(s => s.CoverImage).FirstOrDefaultAsync(s => s.Id == id, ct)
              ?? throw new NotFoundException("Hizmet bulunamadı."));

    public async Task<AdminServiceDto> SaveServiceAsync(Guid? id, UpsertServiceRequest r, CancellationToken ct)
    {
        await validator.ValidateAndThrowAsync(r, ct);
        var slug = ResolveSlug(r.Slug, r.Title);
        if (await db.Services.AnyAsync(s => s.Slug == slug && s.Id != id, ct))
            throw new ConflictException($"'{slug}' slug'ı başka bir hizmette kullanılıyor.");
        await EnsureMediaExistsAsync(db, r.CoverImageId, ct);

        Service entity;
        if (id is null)
        {
            entity = new Service { Slug = slug, Title = r.Title, Summary = r.Summary };
            db.Services.Add(entity);
        }
        else
        {
            entity = await db.Services.FirstOrDefaultAsync(s => s.Id == id, ct) ?? throw new NotFoundException("Hizmet bulunamadı.");
        }

        if (id is not null) RequireVersion(entity, r.Version);

        entity.Slug = slug;
        entity.Title = r.Title.Trim();
        entity.Summary = r.Summary.Trim();
        entity.Body = r.Body;
        entity.Icon = r.Icon;
        entity.CoverImageId = r.CoverImageId;
        entity.SortOrder = r.SortOrder;
        entity.IsPublished = r.IsPublished;
        entity.SeoTitle = r.SeoTitle;
        entity.SeoDescription = r.SeoDescription;
        entity.UpdatedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);
        return await GetServiceAsync(entity.Id, ct);
    }

    public async Task DeleteServiceAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.Services.FindAsync([id], ct) ?? throw new NotFoundException("Hizmet bulunamadı.");
        db.Services.Remove(entity);
        await db.SaveChangesAsync(ct);
    }
}
