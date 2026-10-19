using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Veykivo.Infrastructure.Identity;

namespace Veykivo.Api.Infrastructure;

public static class SessionValidation
{
    public static async Task ValidateAsync(CookieValidatePrincipalContext context)
    {
        // Identity'nin parola/security stamp iptal kontrolünü koru.
        await SecurityStampValidator.ValidatePrincipalAsync(context);
        if (context.Principal?.Identity?.IsAuthenticated != true) return;

        var users = context.HttpContext.RequestServices.GetRequiredService<UserManager<AppUser>>();
        var user = await users.GetUserAsync(context.Principal);
        if (user is { IsActive: true } && await users.IsInRoleAsync(user, Roles.Admin)) return;

        context.RejectPrincipal();
        await context.HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
    }
}
