using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FluentValidation;
using System.Text.Json;
using Veykivo.Application.Common;
using Veykivo.Application.Services.Ai;

namespace Veykivo.Api.Infrastructure;

/// <summary>Uygulama istisnalarını tutarlı RFC 9457 problem ayrıntılarına çevirir.</summary>
public sealed class ProblemExceptionHandler(IProblemDetailsService problemDetails, ILogger<ProblemExceptionHandler> logger)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext http, Exception exception, CancellationToken ct)
    {
        if (exception is ValidationException validation)
        {
            http.Response.StatusCode = StatusCodes.Status400BadRequest;
            return await problemDetails.TryWriteAsync(new ProblemDetailsContext
            {
                HttpContext = http,
                ProblemDetails = new HttpValidationProblemDetails(validation.Errors
                    .GroupBy(e => JsonNamingPolicy.CamelCase.ConvertName(e.PropertyName))
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).Distinct().ToArray()))
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Formda düzeltilmesi gereken alanlar var.",
                },
            });
        }
        var (status, title) = exception switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, "Kayıt bulunamadı."),
            ConflictException => (StatusCodes.Status409Conflict, "Çakışma."),
            BadRequestException => (StatusCodes.Status400BadRequest, "Geçersiz istek."),
            BadHttpRequestException badHttp => (badHttp.StatusCode, "Geçersiz istek."),
            AiUnavailableException => (StatusCodes.Status503ServiceUnavailable, "Yapay zekâ servisi kullanılamıyor."),
            DbUpdateConcurrencyException => (StatusCodes.Status409Conflict, "İçerik başka bir işlemde değiştirildi. Sayfayı yenileyip tekrar deneyin."),
            _ => (StatusCodes.Status500InternalServerError, "Beklenmeyen bir hata oluştu."),
        };

        if (status == StatusCodes.Status500InternalServerError)
            logger.LogError(exception, "İşlenmeyen hata: {Path}", http.Request.Path);

        http.Response.StatusCode = status;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = http,
            Exception = exception,
            ProblemDetails = new ProblemDetails
            {
                Status = status,
                Title = title,
                // 500 hatalarında iç ayrıntı dışarı sızdırılmaz.
                Detail = status == StatusCodes.Status500InternalServerError ? null
                    : exception is DbUpdateConcurrencyException ? title : exception.Message,
            },
        });
    }
}
