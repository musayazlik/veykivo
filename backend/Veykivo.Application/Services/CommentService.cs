using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Common;
using Veykivo.Application.Contracts;
using Veykivo.Domain.Entities;
using Veykivo.Domain.Enums;

namespace Veykivo.Application.Services;

/// <summary>
/// Ziyaretçi yorumları. Yeni yorumlar "Bekliyor" durumunda kaydedilir ve onaylanmadan sitede görünmez.
/// Yalnızca tek seviye yanıt vardır: yanıtın yanıtı, ana yoruma bağlanır.
/// </summary>
public sealed class CommentService(
    IAppDbContext db,
    TimeProvider clock,
    IValidator<CreateCommentRequest> createValidator,
    ILogger<CommentService> logger)
{
    public async Task<CommentCreatedDto> CreateAsync(string postSlug, CreateCommentRequest r, CancellationToken ct)
    {
        // Honeypot doğrulamadan önce kontrol edilir; bot geçersiz form alanları yüzünden 400 alıp
        // hangi alanların denetlendiğini öğrenemesin, sessizce başarı yanıtı almaya devam etsin.
        if (!string.IsNullOrWhiteSpace(r.Website))
        {
            logger.LogInformation("Honeypot alanı dolu bir yorum yok sayıldı.");
            return new CommentCreatedDto(true);
        }
        await createValidator.ValidateAndThrowAsync(r, ct);

        var now = clock.GetUtcNow();
        var postId = await db.Posts.AsNoTracking()
                         .Where(p => p.Slug == postSlug && p.Status == PostStatus.Published && p.PublishedAt <= now)
                         .Select(p => (Guid?)p.Id).FirstOrDefaultAsync(ct)
                     ?? throw new NotFoundException("Yazı bulunamadı.");

        Guid? parentId = null;
        if (r.ParentId is { } requestedParent)
        {
            var parent = await db.Comments.AsNoTracking()
                             .FirstOrDefaultAsync(c => c.Id == requestedParent && c.PostId == postId && c.Status == CommentStatus.Approved, ct)
                         ?? throw new BadRequestException("Yanıtlanan yorum bulunamadı.");
            parentId = parent.ParentId ?? parent.Id;
        }

        db.Comments.Add(new Comment
        {
            PostId = postId,
            ParentId = parentId,
            AuthorName = r.AuthorName.Trim(),
            AuthorEmail = string.IsNullOrWhiteSpace(r.AuthorEmail) ? null : r.AuthorEmail.Trim().ToLowerInvariant(),
            Body = r.Body.Trim(),
            CreatedAt = now,
        });
        await db.SaveChangesAsync(ct);
        return new CommentCreatedDto(true);
    }

    public async Task<PagedResult<AdminCommentDto>> ListAsync(CommentStatus? status, string? q, int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.Comments.AsNoTracking();
        if (status is not null) query = query.Where(c => c.Status == status);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(c => c.AuthorName.ToLower().Contains(term) || c.Body.ToLower().Contains(term) ||
                                     c.Post.Title.ToLower().Contains(term) || (c.AuthorEmail != null && c.AuthorEmail.Contains(term)));
        }

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(c => new AdminCommentDto(c.Id, c.PostId, c.Post.Title, c.Post.Slug, c.ParentId, c.AuthorName, c.AuthorEmail,
                c.Body, c.Status, c.IsStaffReply, c.Replies.Count, c.CreatedAt))
            .ToListAsync(ct);
        return new PagedResult<AdminCommentDto>(items, page, pageSize, total);
    }

    public async Task UpdateStatusAsync(Guid id, CommentStatus status, CancellationToken ct)
    {
        var comment = await db.Comments.FindAsync([id], ct) ?? throw new NotFoundException("Yorum bulunamadı.");
        comment.Status = status;
        await db.SaveChangesAsync(ct);
    }

    /// <summary>Panelden ekip yanıtı ekler; yanıt doğrudan onaylı yayınlanır, ana yorum da onaylanır.</summary>
    public async Task ReplyAsync(Guid id, string body, string authorName, CancellationToken ct)
    {
        var target = await db.Comments.FindAsync([id], ct) ?? throw new NotFoundException("Yorum bulunamadı.");
        var rootId = target.ParentId ?? target.Id;
        if (target.ParentId is null && target.Status != CommentStatus.Approved) target.Status = CommentStatus.Approved;

        db.Comments.Add(new Comment
        {
            PostId = target.PostId,
            ParentId = rootId,
            AuthorName = authorName,
            Body = body.Trim(),
            Status = CommentStatus.Approved,
            IsStaffReply = true,
            CreatedAt = clock.GetUtcNow(),
        });
        await db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var comment = await db.Comments.FindAsync([id], ct) ?? throw new NotFoundException("Yorum bulunamadı.");
        db.Comments.Remove(comment);
        await db.SaveChangesAsync(ct);
    }

    /// <summary>Public detay sayfası için onaylı yorumlar, yanıtlarıyla birlikte (eskiden yeniye).</summary>
    public async Task<IReadOnlyList<PublicCommentDto>> GetApprovedThreadAsync(Guid postId, CancellationToken ct)
    {
        var rows = await db.Comments.AsNoTracking()
            .Where(c => c.PostId == postId && c.Status == CommentStatus.Approved)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new { c.Id, c.ParentId, c.AuthorName, c.Body, c.IsStaffReply, c.CreatedAt })
            .ToListAsync(ct);

        var replies = rows.Where(r => r.ParentId != null).ToLookup(r => r.ParentId!.Value);
        return rows.Where(r => r.ParentId == null)
            .Select(r => new PublicCommentDto(r.Id, r.AuthorName, r.Body, r.IsStaffReply, r.CreatedAt,
                replies[r.Id].Select(x => new PublicCommentDto(x.Id, x.AuthorName, x.Body, x.IsStaffReply, x.CreatedAt, [])).ToList()))
            .ToList();
    }
}
