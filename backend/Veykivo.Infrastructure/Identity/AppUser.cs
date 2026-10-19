using Microsoft.AspNetCore.Identity;

namespace Veykivo.Infrastructure.Identity;

public sealed class AppUser : IdentityUser<Guid>
{
    public string? DisplayName { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public static class Roles
{
    public const string Admin = "Admin";
}
