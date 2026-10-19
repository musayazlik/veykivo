using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Common;
using Veykivo.Application.Contracts;
using Veykivo.Domain.Entities;
using Veykivo.Domain.Enums;
using static Veykivo.Application.Services.ContentRules;

namespace Veykivo.Application.Services;

public sealed class DashboardService(IAppDbContext db)
{
    // ------------------------------------------------------------------ Dashboard

    public async Task<DashboardSummaryDto> GetDashboardAsync(CancellationToken ct)
    {
        var recent = await db.Inquiries.AsNoTracking().OrderByDescending(i => i.CreatedAt).Take(5)
            .Select(i => new InquiryListItemDto(i.Id, i.Name, i.Email, i.Company, i.ServiceInterest, i.Status, i.CreatedAt))
            .ToListAsync(ct);

        return new DashboardSummaryDto(
            await db.Services.CountAsync(ct),
            await db.Projects.CountAsync(ct),
            await db.Posts.CountAsync(ct),
            await db.TeamMembers.CountAsync(ct),
            await db.Technologies.CountAsync(ct),
            await db.Inquiries.CountAsync(i => i.Status == InquiryStatus.New, ct),
            await db.Inquiries.CountAsync(ct),
            await db.Comments.CountAsync(c => c.Status == CommentStatus.Pending, ct),
            recent);
    }
}
