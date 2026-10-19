using Microsoft.EntityFrameworkCore;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Common;
using Veykivo.Application.Contracts;
using Veykivo.Domain.Entities;

namespace Veykivo.Application.Services;

internal static class ContentRules
{
    public static MediaDto? Media(MediaAsset? media) => media is null ? null : new(media.Id, media.Url, media.AltText);

    public static async Task EnsureMediaExistsAsync(IAppDbContext db, Guid? mediaId, CancellationToken ct)
    {
        if (mediaId is { } id && !await db.MediaAssets.AnyAsync(m => m.Id == id, ct))
            throw new BadRequestException("Seçilen görsel bulunamadı.");
    }

    public static string ResolveSlug(string? requested, string title)
    {
        var generated = Slug.From(title);
        var slug = string.IsNullOrWhiteSpace(requested) ? generated[..Math.Min(generated.Length, 160)].TrimEnd('-') : requested.Trim();
        if (slug.Length == 0) throw new BadRequestException("Başlıktan geçerli bir slug üretilemedi.");
        return slug;
    }

    public static void RequireVersion(IVersionedEntity entity, Guid? expected)
    {
        if (expected is null) throw new BadRequestException("Güncellemek için içerik sürümü gerekli. Sayfayı yenileyin.");
        if (entity.Version != expected) throw new ConflictException("İçerik başka bir işlemde değiştirildi. Değişikliklerinizi koruyup güncel kaydı yeniden açın.");
    }
}
