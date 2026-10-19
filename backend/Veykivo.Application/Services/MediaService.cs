using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Common;
using Veykivo.Application.Contracts;
using Veykivo.Domain.Entities;

namespace Veykivo.Application.Services;

public sealed class MediaService(IAppDbContext db, IFileStorage storage, ILogger<MediaService> logger)
{
    public const long MaxBytes = 5 * 1024 * 1024;

    private static readonly Dictionary<string, string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp",
        [".avif"] = "image/avif",
    };

    private static MediaAssetDto ToDto(MediaAsset m) => new(m.Id, m.Url, m.AltText, m.MimeType, m.SizeBytes, m.CreatedAt);

    public async Task<IReadOnlyList<MediaAssetDto>> ListAsync(CancellationToken ct) =>
        (await db.MediaAssets.AsNoTracking().OrderByDescending(m => m.CreatedAt).Take(500).ToListAsync(ct))
        .Select(ToDto).ToList();

    /// <summary>Uzantı, bildirilen MIME tipi, boyut ve dosya imzası (magic bytes) birlikte doğrulanır.</summary>
    public async Task<MediaAssetDto> UploadAsync(Stream content, string fileName, string contentType, long length,
        string? altText, CancellationToken ct)
    {
        var normalizedAltText = MediaRules.NormalizeAltText(altText, allowNull: true);
        if (length <= 0) throw new BadRequestException("Dosya boş.");
        if (length > MaxBytes) throw new BadRequestException("Dosya en fazla 5 MB olabilir.");

        var ext = Path.GetExtension(fileName);
        if (!AllowedTypes.TryGetValue(ext, out var mime))
            throw new BadRequestException("Yalnızca JPG, PNG, WEBP veya AVIF görseller yüklenebilir.");
        if (!string.Equals(contentType, mime, StringComparison.OrdinalIgnoreCase))
            throw new BadRequestException("Dosya türü uzantısıyla uyuşmuyor.");

        using var buffer = new MemoryStream();
        var chunk = new byte[81920];
        int read;
        while ((read = await content.ReadAsync(chunk, ct)) > 0)
        {
            if (buffer.Length + read > MaxBytes) throw new BadRequestException("Dosya en fazla 5 MB olabilir.");
            await buffer.WriteAsync(chunk.AsMemory(0, read), ct);
        }
        if (buffer.Length != length) throw new BadRequestException("Dosya boyutu bildirilen uzunlukla uyuşmuyor.");
        if (!HasValidSignature(buffer.GetBuffer().AsSpan(0, (int)Math.Min(buffer.Length, 32)), mime))
            throw new BadRequestException("Dosya içeriği geçerli bir görsel değil.");

        buffer.Position = 0;
        var stored = await storage.SaveAsync(buffer, ext.ToLowerInvariant() == ".jpeg" ? ".jpg" : ext.ToLowerInvariant(), mime, ct);
        var asset = new MediaAsset
        {
            StorageKey = stored.StorageKey,
            Url = stored.Url,
            MimeType = mime,
            SizeBytes = buffer.Length,
            AltText = normalizedAltText,
        };
        db.MediaAssets.Add(asset);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch
        {
            // İstek iptal edilmiş olsa da yüklenen dosya temizlenmeli.
            try { await storage.DeleteAsync(stored.StorageKey, CancellationToken.None); }
            catch (Exception cleanupError)
            {
                logger.LogError(cleanupError, "Başarısız yüklemenin dosyası temizlenemedi: {StorageKey}", stored.StorageKey);
            }
            throw;
        }
        return ToDto(asset);
    }

    public async Task<MediaAssetDto> UpdateAltAsync(Guid id, string altText, CancellationToken ct)
    {
        var asset = await db.MediaAssets.FindAsync([id], ct) ?? throw new NotFoundException("Görsel bulunamadı.");
        asset.AltText = MediaRules.NormalizeAltText(altText);
        await db.SaveChangesAsync(ct);
        return ToDto(asset);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var asset = await db.MediaAssets.FindAsync([id], ct) ?? throw new NotFoundException("Görsel bulunamadı.");
        var inUse = await db.Services.AnyAsync(s => s.CoverImageId == id, ct)
                    || await db.Projects.AnyAsync(p => p.CoverImageId == id, ct)
                    || await db.Posts.AnyAsync(p => p.CoverImageId == id, ct)
                    || await db.TeamMembers.AnyAsync(m => m.PhotoId == id, ct);
        if (inUse) throw new ConflictException("Bu görsel bir içerikte kullanılıyor; önce içerikten kaldırın.");

        db.MediaAssets.Remove(asset);
        if (!asset.StorageKey.StartsWith("static:", StringComparison.Ordinal))
            db.PendingFileDeletions.Add(new PendingFileDeletion { StorageKey = asset.StorageKey });
        await db.SaveChangesAsync(ct);
    }

    public static bool HasValidSignature(ReadOnlySpan<byte> h, string mime) => mime switch
    {
        "image/jpeg" => h.Length >= 3 && h[0] == 0xFF && h[1] == 0xD8 && h[2] == 0xFF,
        "image/png" => h.Length >= 8 && h[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
        "image/webp" => h.Length >= 12 && h[..4].SequenceEqual("RIFF"u8) && h[8..12].SequenceEqual("WEBP"u8),
        "image/avif" => h.Length >= 12 && h[4..8].SequenceEqual("ftyp"u8) && (h[8..12].SequenceEqual("avif"u8) || h[8..12].SequenceEqual("avis"u8)),
        _ => false,
    };
}
