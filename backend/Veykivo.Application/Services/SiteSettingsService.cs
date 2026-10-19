using Microsoft.EntityFrameworkCore;
using System.Net.Mail;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Common;
using Veykivo.Domain.Entities;

namespace Veykivo.Application.Services;

public sealed class SiteSettingsService(IAppDbContext db)
{
    public async Task<IReadOnlyDictionary<string, string>> GetAllAsync(CancellationToken ct)
    {
        var stored = await db.SiteSettings.AsNoTracking().ToDictionaryAsync(s => s.Key, s => s.Value, ct);
        // Panelde tüm bilinen alanlar boş olsa da görünsün.
        return SiteSettingKeys.All.ToDictionary(k => k, k => stored.GetValueOrDefault(k, string.Empty));
    }

    public async Task<IReadOnlyDictionary<string, string>> UpdateAsync(IReadOnlyDictionary<string, string> values, CancellationToken ct)
    {
        if (values is null) throw new BadRequestException("Ayarlar boş olamaz.");
        var unknown = values.Keys.Where(k => !SiteSettingKeys.All.Contains(k)).ToList();
        if (unknown.Count > 0) throw new BadRequestException($"Bilinmeyen ayar: {string.Join(", ", unknown)}");
        if (values.Values.Any(v => v is null || v.Length > 1000))
            throw new BadRequestException("Ayar değerleri null olamaz ve en fazla 1000 karakter olabilir.");
        foreach (var (key, raw) in values)
        {
            var value = raw.Trim();
            if (value.Length == 0) continue;
            if ((key == SiteSettingKeys.ContactEmail || key == SiteSettingKeys.NotificationEmail) &&
                (!MailAddress.TryCreate(value, out var address) || address.Address != value))
                throw new BadRequestException("Geçerli bir e-posta adresi girin.");
            if (key.StartsWith("social.", StringComparison.Ordinal) &&
                (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme is not ("https" or "http")))
                throw new BadRequestException("Sosyal bağlantılar http veya https adresi olmalı.");
        }

        var existing = await db.SiteSettings.ToDictionaryAsync(s => s.Key, ct);
        foreach (var (key, value) in values)
        {
            if (existing.TryGetValue(key, out var setting)) setting.Value = value.Trim();
            else db.SiteSettings.Add(new SiteSetting { Key = key, Value = value.Trim() });
        }
        await db.SaveChangesAsync(ct);
        return await GetAllAsync(ct);
    }
}
