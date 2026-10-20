using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Common;
using Veykivo.Application.Contracts;
using Veykivo.Domain.Entities;
using Veykivo.Domain.Enums;

namespace Veykivo.Application.Services;

public sealed class InquiryService(
    IAppDbContext db,
    IEmailSender email,
    TimeProvider clock,
    IValidator<CreateInquiryRequest> createValidator,
    ILogger<InquiryService> logger)
{
    /// <summary>
    /// Talebi önce veritabanına yazar; bildirim e-postası başarısız olsa bile kayıt korunur.
    /// Honeypot dolu gelirse doğrulamaya geçilmeden kayıt yapılmadan başarılı yanıt verilir
    /// (bota hangi alanların denetlendiği bilgisini verecek 400 dönülmez).
    /// </summary>
    public async Task<InquiryCreatedDto> CreateAsync(CreateInquiryRequest r, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(r.Website))
        {
            logger.LogInformation("Honeypot alanı dolu bir talep yok sayıldı.");
            return new InquiryCreatedDto(null);
        }
        await createValidator.ValidateAndThrowAsync(r, ct);

        var now = clock.GetUtcNow();
        var inquiry = new Inquiry
        {
            Name = r.Name.Trim(),
            Email = r.Email.Trim().ToLowerInvariant(),
            Company = NullIfEmpty(r.Company),
            Phone = NullIfEmpty(r.Phone),
            ServiceInterest = NullIfEmpty(r.ServiceInterest),
            Message = r.Message.Trim(),
            ConsentedAt = now,
            CreatedAt = now,
            UpdatedAt = now,
        };
        db.Inquiries.Add(inquiry);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Yeni talep kaydedildi: {InquiryId}", inquiry.Id);

        await NotifyAsync(inquiry, ct);
        return new InquiryCreatedDto(inquiry.Id);
    }

    private async Task NotifyAsync(Inquiry inquiry, CancellationToken ct)
    {
        try
        {
            var to = await db.SiteSettings.AsNoTracking()
                .Where(s => s.Key == SiteSettingKeys.NotificationEmail)
                .Select(s => s.Value).FirstOrDefaultAsync(ct);
            if (string.IsNullOrWhiteSpace(to)) return;

            var body = $"""
                Yeni bir teklif/iletişim talebi geldi.

                Ad: {inquiry.Name}
                E-posta: {inquiry.Email}
                Şirket: {inquiry.Company ?? "-"}
                Telefon: {inquiry.Phone ?? "-"}
                İlgilenilen hizmet: {inquiry.ServiceInterest ?? "-"}

                Mesajın tamamını yönetim panelinden görüntüleyin.
                """;
            await email.SendAsync(to, $"Yeni talep: {inquiry.Name}", body, ct);
        }
        catch (Exception ex)
        {
            // Bildirim hatası talep kaydını etkilememeli; mesaj içeriği loglanmaz.
            logger.LogWarning(ex, "Talep bildirimi gönderilemedi: {InquiryId}", inquiry.Id);
        }
    }

    public async Task<PagedResult<InquiryListItemDto>> ListAsync(InquiryStatus? status, string? q, int page, int pageSize, CancellationToken ct)
    {
        var pagination = Pagination.Create(page, pageSize, 100);
        page = pagination.Page;
        pageSize = pagination.PageSize;
        var query = db.Inquiries.AsNoTracking();
        if (status is not null) query = query.Where(i => i.Status == status);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(i => i.Name.ToLower().Contains(term) || i.Email.Contains(term) ||
                                     (i.Company != null && i.Company.ToLower().Contains(term)));
        }

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(i => i.CreatedAt)
            .Skip(pagination.Offset).Take(pageSize)
            .Select(i => new InquiryListItemDto(i.Id, i.Name, i.Email, i.Company, i.ServiceInterest, i.Status, i.CreatedAt))
            .ToListAsync(ct);
        return new PagedResult<InquiryListItemDto>(items, page, pageSize, total);
    }

    public async Task<InquiryDetailDto> GetAsync(Guid id, CancellationToken ct) =>
        await db.Inquiries.AsNoTracking().Where(i => i.Id == id)
            .Select(i => new InquiryDetailDto(i.Id, i.Name, i.Email, i.Company, i.Phone, i.ServiceInterest, i.Message,
                i.Status, i.ConsentedAt, i.CreatedAt, i.UpdatedAt))
            .FirstOrDefaultAsync(ct)
        ?? throw new NotFoundException("Talep bulunamadı.");

    public async Task<InquiryDetailDto> UpdateStatusAsync(Guid id, InquiryStatus status, CancellationToken ct)
    {
        var inquiry = await db.Inquiries.FindAsync([id], ct) ?? throw new NotFoundException("Talep bulunamadı.");
        inquiry.Status = status;
        inquiry.UpdatedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }

    private static string? NullIfEmpty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
