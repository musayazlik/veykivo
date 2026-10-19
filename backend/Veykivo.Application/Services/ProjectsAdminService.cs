using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Common;
using Veykivo.Application.Contracts;
using Veykivo.Domain.Entities;
using Veykivo.Domain.Enums;
using static Veykivo.Application.Services.ContentRules;

namespace Veykivo.Application.Services;

public sealed class ProjectsAdminService(IAppDbContext db, TimeProvider clock, IValidator<UpsertProjectRequest> validator)
{
    // ------------------------------------------------------------------ Projects

    private static AdminProjectDto ToDto(Project p) => new(p.Id, p.Slug, p.Title, p.ClientName, p.Sector, p.Summary,
        p.Challenge, p.Solution, p.Outcome, p.CoverImageId, Media(p.CoverImage), p.IsPublished, p.IsFeatured, p.SortOrder,
        p.PublishedAt, p.Technologies.Select(t => t.TechnologyId).ToList(), p.SeoTitle, p.SeoDescription, p.UpdatedAt, p.Version);

    public async Task<IReadOnlyList<AdminProjectDto>> ListProjectsAsync(CancellationToken ct) =>
        (await db.Projects.AsNoTracking().Include(p => p.CoverImage).Include(p => p.Technologies)
            .OrderBy(p => p.SortOrder).ThenByDescending(p => p.CreatedAt).ToListAsync(ct)).Select(ToDto).ToList();

    public async Task<AdminProjectDto> GetProjectAsync(Guid id, CancellationToken ct) =>
        ToDto(await db.Projects.AsNoTracking().Include(p => p.CoverImage).Include(p => p.Technologies)
                  .FirstOrDefaultAsync(p => p.Id == id, ct)
              ?? throw new NotFoundException("Proje bulunamadı."));

    public async Task<AdminProjectDto> SaveProjectAsync(Guid? id, UpsertProjectRequest r, CancellationToken ct)
    {
        await validator.ValidateAndThrowAsync(r, ct);
        var slug = ResolveSlug(r.Slug, r.Title);
        if (await db.Projects.AnyAsync(p => p.Slug == slug && p.Id != id, ct))
            throw new ConflictException($"'{slug}' slug'ı başka bir projede kullanılıyor.");
        await EnsureMediaExistsAsync(db, r.CoverImageId, ct);

        var techIds = (r.TechnologyIds ?? []).Distinct().ToList();
        if (techIds.Count > 0 && await db.Technologies.CountAsync(t => techIds.Contains(t.Id), ct) != techIds.Count)
            throw new BadRequestException("Seçilen teknolojilerden biri bulunamadı.");

        Project entity;
        if (id is null)
        {
            entity = new Project { Slug = slug, Title = r.Title, Summary = r.Summary };
            db.Projects.Add(entity);
        }
        else
        {
            entity = await db.Projects.Include(p => p.Technologies).FirstOrDefaultAsync(p => p.Id == id, ct)
                     ?? throw new NotFoundException("Proje bulunamadı.");
        }

        if (id is not null) RequireVersion(entity, r.Version);

        entity.Slug = slug;
        entity.Title = r.Title.Trim();
        entity.ClientName = r.ClientName;
        entity.Sector = r.Sector;
        entity.Summary = r.Summary.Trim();
        entity.Challenge = r.Challenge;
        entity.Solution = r.Solution;
        entity.Outcome = r.Outcome;
        entity.CoverImageId = r.CoverImageId;
        entity.IsFeatured = r.IsFeatured;
        entity.SortOrder = r.SortOrder;
        entity.SeoTitle = r.SeoTitle;
        entity.SeoDescription = r.SeoDescription;
        entity.SetPublished(r.IsPublished, clock.GetUtcNow());
        entity.UpdatedAt = clock.GetUtcNow();

        entity.Technologies.RemoveAll(t => !techIds.Contains(t.TechnologyId));
        foreach (var techId in techIds.Where(t => entity.Technologies.All(x => x.TechnologyId != t)))
            entity.Technologies.Add(new ProjectTechnology { ProjectId = entity.Id, TechnologyId = techId });

        await db.SaveChangesAsync(ct);
        return await GetProjectAsync(entity.Id, ct);
    }

    public async Task DeleteProjectAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.Projects.FindAsync([id], ct) ?? throw new NotFoundException("Proje bulunamadı.");
        db.Projects.Remove(entity);
        await db.SaveChangesAsync(ct);
    }
}
