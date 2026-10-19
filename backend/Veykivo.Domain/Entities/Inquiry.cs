using Veykivo.Domain.Enums;

namespace Veykivo.Domain.Entities;

public class Inquiry
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public required string Name { get; set; }
    public required string Email { get; set; }
    public string? Company { get; set; }
    public string? Phone { get; set; }
    public string? ServiceInterest { get; set; }
    public required string Message { get; set; }
    public InquiryStatus Status { get; set; } = InquiryStatus.New;
    public DateTimeOffset ConsentedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
