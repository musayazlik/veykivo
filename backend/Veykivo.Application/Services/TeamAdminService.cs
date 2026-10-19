using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Common;
using Veykivo.Application.Contracts;
using Veykivo.Domain.Entities;
using Veykivo.Domain.Enums;
using static Veykivo.Application.Services.ContentRules;

namespace Veykivo.Application.Services;

public sealed class TeamAdminService(IAppDbContext db, IValidator<UpsertTeamMemberRequest> validator)
{
    // ------------------------------------------------------------------ Team

    private static AdminTeamMemberDto ToDto(TeamMember m) => new(m.Id, m.Name, m.RoleTitle, m.Bio, m.PhotoId, Media(m.Photo),
        m.LinkedInUrl, m.SortOrder, m.IsPublished, m.Version);

    public async Task<IReadOnlyList<AdminTeamMemberDto>> ListTeamAsync(CancellationToken ct) =>
        (await db.TeamMembers.AsNoTracking().Include(m => m.Photo).OrderBy(m => m.SortOrder).ThenBy(m => m.Name)
            .ToListAsync(ct)).Select(ToDto).ToList();

    public async Task<AdminTeamMemberDto> GetTeamMemberAsync(Guid id, CancellationToken ct) =>
        ToDto(await db.TeamMembers.AsNoTracking().Include(m => m.Photo).FirstOrDefaultAsync(m => m.Id == id, ct)
              ?? throw new NotFoundException("Ekip üyesi bulunamadı."));

    public async Task<AdminTeamMemberDto> SaveTeamMemberAsync(Guid? id, UpsertTeamMemberRequest r, CancellationToken ct)
    {
        await validator.ValidateAndThrowAsync(r, ct);
        await EnsureMediaExistsAsync(db, r.PhotoId, ct);

        TeamMember entity;
        if (id is null)
        {
            entity = new TeamMember { Name = r.Name, RoleTitle = r.RoleTitle };
            db.TeamMembers.Add(entity);
        }
        else
        {
            entity = await db.TeamMembers.FindAsync([id], ct) ?? throw new NotFoundException("Ekip üyesi bulunamadı.");
        }

        if (id is not null) RequireVersion(entity, r.Version);

        entity.Name = r.Name.Trim();
        entity.RoleTitle = r.RoleTitle.Trim();
        entity.Bio = r.Bio;
        entity.PhotoId = r.PhotoId;
        entity.LinkedInUrl = string.IsNullOrWhiteSpace(r.LinkedInUrl) ? null : r.LinkedInUrl.Trim();
        entity.SortOrder = r.SortOrder;
        entity.IsPublished = r.IsPublished;
        await db.SaveChangesAsync(ct);
        return await GetTeamMemberAsync(entity.Id, ct);
    }

    public async Task DeleteTeamMemberAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.TeamMembers.FindAsync([id], ct) ?? throw new NotFoundException("Ekip üyesi bulunamadı.");
        db.TeamMembers.Remove(entity);
        await db.SaveChangesAsync(ct);
    }
}
