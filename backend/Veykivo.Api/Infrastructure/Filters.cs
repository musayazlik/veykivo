using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Antiforgery;

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

public static class EndpointFilterExtensions
{
    public static RouteHandlerBuilder Validate<T>(this RouteHandlerBuilder builder) =>
        builder.AddEndpointFilter<ValidationFilter<T>>().ProducesValidationProblem();
}
