using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Veykivo.Api.Infrastructure;
using Veykivo.Application.Contracts;
using Veykivo.Infrastructure.Identity;

namespace Veykivo.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/api/v1/auth").WithTags("Auth").AddEndpointFilter<AntiforgeryFilter>();

        // Oturum durumu değişince (giriş/çıkış) token yenilenmeli; istemci her değişiklikten sonra tekrar çağırır.
        auth.MapGet("/csrf", (HttpContext http, IAntiforgery antiforgery) =>
            {
                var tokens = antiforgery.GetAndStoreTokens(http);
                return TypedResults.Ok(new CsrfTokenDto(tokens.RequestToken!));
            })
            .WithName("GetCsrfToken");

        auth.MapPost("/login", Login)
            .Validate<LoginRequest>()
            .RequireRateLimiting(RateLimitPolicies.Login)
            .WithName("Login");

        auth.MapPost("/logout", async (SignInManager<AppUser> signIn) =>
            {
                await signIn.SignOutAsync();
                return TypedResults.NoContent();
            })
            .RequireAuthorization()
            .WithName("Logout");

        auth.MapGet("/me", Me).RequireAuthorization().WithName("GetCurrentUser");

        return app;
    }

    private static async Task<Results<Ok<CurrentUserDto>, ProblemHttpResult>> Login(
        LoginRequest request, UserManager<AppUser> users, SignInManager<AppUser> signIn)
    {
        var invalid = TypedResults.Problem(statusCode: 401, title: "Giriş başarısız.",
            detail: "E-posta veya parola hatalı.");

        var user = await users.FindByEmailAsync(request.Email.Trim());
        if (user is null || !user.IsActive || !await users.HasPanelRoleAsync(user))
            return invalid;

        var result = await signIn.PasswordSignInAsync(user, request.Password, isPersistent: true, lockoutOnFailure: true);
        if (result.IsLockedOut)
            return TypedResults.Problem(statusCode: 423, title: "Hesap geçici olarak kilitlendi.",
                detail: "Çok sayıda hatalı deneme yapıldı. 15 dakika sonra tekrar deneyin.");
        if (!result.Succeeded) return invalid;

        var roles = await users.GetRolesAsync(user);
        return TypedResults.Ok(new CurrentUserDto(user.Id, user.Email!, user.DisplayName, roles.ToList()));
    }

    private static async Task<Results<Ok<CurrentUserDto>, UnauthorizedHttpResult>> Me(
        ClaimsPrincipal principal, UserManager<AppUser> users)
    {
        var user = await users.GetUserAsync(principal);
        if (user is null || !user.IsActive) return TypedResults.Unauthorized();
        var roles = await users.GetRolesAsync(user);
        return TypedResults.Ok(new CurrentUserDto(user.Id, user.Email!, user.DisplayName, roles.ToList()));
    }
}
