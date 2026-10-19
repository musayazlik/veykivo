using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Common;
using Veykivo.Application.Contracts;
using Veykivo.Domain.Entities;
using Veykivo.Domain.Enums;
using static Veykivo.Application.Services.ContentRules;

namespace Veykivo.Application.Services;

public sealed class TechnologiesAdminService(IAppDbContext db, IValidator<UpsertTechnologyRequest> validator)
{
    // ------------------------------------------------------------------ Technologies

    private static AdminTechnologyDto ToDto(Technology t) => new(t.Id, t.Name, t.Category, t.Icon, t.SortOrder, t.IsPublished, t.Version);

    public async Task<IReadOnlyList<AdminTechnologyDto>> ListTechnologiesAsync(CancellationToken ct) =>
        (await db.Technologies.AsNoTracking().OrderBy(t => t.Category).ThenBy(t => t.SortOrder).ThenBy(t => t.Name)
            .ToListAsync(ct)).Select(ToDto).ToList();

    public async Task<AdminTechnologyDto> GetTechnologyAsync(Guid id, CancellationToken ct) =>
        ToDto(await db.Technologies.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id, ct)
              ?? throw new NotFoundException("Teknoloji bulunamadı."));

    public async Task<AdminTechnologyDto> SaveTechnologyAsync(Guid? id, UpsertTechnologyRequest r, CancellationToken ct)
    {
        await validator.ValidateAndThrowAsync(r, ct);
        var name = r.Name.Trim();
        if (await db.Technologies.AnyAsync(t => t.Name == name && t.Id != id, ct))
            throw new ConflictException($"'{name}' adında bir teknoloji zaten var.");

        Technology entity;
        if (id is null)
        {
            entity = new Technology { Name = name };
            db.Technologies.Add(entity);
        }
        else
        {
            entity = await db.Technologies.FindAsync([id], ct) ?? throw new NotFoundException("Teknoloji bulunamadı.");
        }

        if (id is not null) RequireVersion(entity, r.Version);

        entity.Name = name;
        entity.Category = r.Category;
        entity.Icon = r.Icon;
        entity.SortOrder = r.SortOrder;
        entity.IsPublished = r.IsPublished;
        await db.SaveChangesAsync(ct);
        return ToDto(entity);
    }

    public async Task DeleteTechnologyAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.Technologies.FindAsync([id], ct) ?? throw new NotFoundException("Teknoloji bulunamadı.");
        db.Technologies.Remove(entity);
        await db.SaveChangesAsync(ct);
    }
}
