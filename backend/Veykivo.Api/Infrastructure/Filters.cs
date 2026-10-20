using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Veykivo.Infrastructure.Identity;

namespace Veykivo.Api.Infrastructure;

/// <summary>İstek gövdesini ilgili FluentValidation doğrulayıcısıyla kontrol eder.</summary>
public sealed class ValidationFilter<T> : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var validator = ctx.HttpContext.RequestServices.GetService<IValidator<T>>();
        var argument = ctx.Arguments.OfType<T>().FirstOrDefault();
        if (validator is null || argument is null) return await next(ctx);

        var result = await validator.ValidateAsync(argument, ctx.HttpContext.RequestAborted);
        return result.IsValid
            ? await next(ctx)
            : Results.ValidationProblem(
                // İstemci JSON alan adlarıyla (camelCase) eşleştirebilsin.
                result.ToDictionary().ToDictionary(kv => JsonNamingPolicy.CamelCase.ConvertName(kv.Key), kv => kv.Value),
                title: "Formda düzeltilmesi gereken alanlar var.");
    }
}

/// <summary>Cookie tabanlı oturumla yapılan durum değiştiren isteklerde CSRF token'ı (X-CSRF-TOKEN) zorunlu.</summary>
public sealed class AntiforgeryFilter(IAntiforgery antiforgery) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var method = ctx.HttpContext.Request.Method;
        if (HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method))
            return await next(ctx);

        try
        {
            await antiforgery.ValidateRequestAsync(ctx.HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            return Results.Problem(statusCode: StatusCodes.Status400BadRequest,
                title: "Güvenlik doğrulaması başarısız.",
                detail: "Oturum güvenlik anahtarı geçersiz veya süresi dolmuş. Sayfayı yenileyip tekrar deneyin.");
        }
        return await next(ctx);
    }
}

/// <summary>
/// Demo hesabı paneli gezebilir; durum değiştiren istekler yalnız Admin rolüne açıktır.
/// Rol, cookie'deki claim yerine veritabanından okunur: rolü düşürülen hesap oturum yenilenmeden yazamasın.
/// </summary>
public sealed class ReadOnlyDemoFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var method = ctx.HttpContext.Request.Method;
        if (HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method))
            return await next(ctx);

        // Filtre kök sağlayıcıdan oluşturulur; scoped UserManager istek kapsamından alınmalı.
        var users = ctx.HttpContext.RequestServices.GetRequiredService<UserManager<AppUser>>();
        var user = await users.GetUserAsync(ctx.HttpContext.User);
        if (user is not null && await users.IsInRoleAsync(user, Roles.Admin))
            return await next(ctx);

        return Results.Problem(statusCode: StatusCodes.Status403Forbidden,
            title: "Demo hesabı salt okunurdur.",
            detail: "Demo hesabıyla değişiklik yapılamaz; paneli yalnızca inceleyebilirsiniz.");
    }
}

public static class EndpointFilterExtensions
{
    public static RouteHandlerBuilder Validate<T>(this RouteHandlerBuilder builder) =>
        builder.AddEndpointFilter<ValidationFilter<T>>().ProducesValidationProblem();
}
