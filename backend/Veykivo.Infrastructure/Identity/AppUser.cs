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
    /// <summary>Paneli salt okunur gezer; durum değiştiren istekler API'de reddedilir.</summary>
    public const string Demo = "Demo";
}

public static class PanelAccess
{
    /// <summary>Panele girebilen roller: Admin tam yetkili, Demo salt okunur.</summary>
    public static async Task<bool> HasPanelRoleAsync(this UserManager<AppUser> users, AppUser user)
    {
        var roles = await users.GetRolesAsync(user);
        return roles.Contains(Roles.Admin) || roles.Contains(Roles.Demo);
    }
}
