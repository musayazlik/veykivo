using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Veykivo.Application.Services.Ai;

namespace Veykivo.Infrastructure.Ai;

public sealed class OpenRouterOptions
{
    /// <summary>Yalnızca sunucuda tutulur (ortam değişkeni: OpenRouter__ApiKey).</summary>
    public string? ApiKey { get; set; }
    public string BaseUrl { get; set; } = "https://openrouter.ai/api/v1/";
    /// <summary>OpenRouter istatistikleri için uygulama kimliği.</summary>
    public string Referer { get; set; } = "https://veykivo.com";
    public string Title { get; set; } = "Veykivo Panel";
}

/// <summary>OpenRouter'ın OpenAI uyumlu API'si. Akış (streaming) kullanılmaz; her çağrı tek JSON yanıtıdır.</summary>
public sealed class OpenRouterClient(HttpClient http, IOptions<OpenRouterOptions> options, ILogger<OpenRouterClient> logger) : IAiClient
{
    private static readonly SemaphoreSlim CatalogLock = new(1, 1);
    private static (DateTimeOffset At, IReadOnlyList<AiModelInfo> Models)? _catalog;

    private readonly OpenRouterOptions _o = options.Value;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_o.ApiKey);

    private HttpRequestMessage Request(HttpMethod method, string path, object? body = null)
    {
        var req = new HttpRequestMessage(method, new Uri(new Uri(_o.BaseUrl), path));
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _o.ApiKey);
        req.Headers.TryAddWithoutValidation("HTTP-Referer", _o.Referer);
        req.Headers.TryAddWithoutValidation("X-Title", _o.Title);
        if (body is not null) req.Content = JsonContent.Create(body);
        return req;
    }

    private async Task<JsonNode> SendAsync(HttpRequestMessage req, TimeSpan timeout, CancellationToken ct)
    {
        if (!IsConfigured) throw new AiUnavailableException("Yapay zekâ servisi yapılandırılmamış.");
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(timeout);
        try
        {
            using var res = await http.SendAsync(req, cts.Token);
            var text = await res.Content.ReadAsStringAsync(cts.Token);
            if (!res.IsSuccessStatusCode)
            {
                var message = TryReadError(text) ?? res.ReasonPhrase;
                logger.LogWarning("OpenRouter {Status}: {Message}", (int)res.StatusCode, message);
                throw new AiUnavailableException((int)res.StatusCode switch
                {
                    401 or 403 => "OpenRouter anahtarı geçersiz veya yetkisiz.",
                    402 => "OpenRouter bakiyesi yetersiz.",
                    429 => "OpenRouter istek sınırına ulaşıldı. Biraz sonra tekrar deneyin.",
                    _ => $"Yapay zekâ sağlayıcısı hata döndürdü: {message}",
                });
            }
            return JsonNode.Parse(text) ?? throw new AiUnavailableException("Yapay zekâ sağlayıcısından boş yanıt geldi.");
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            throw new AiUnavailableException("Yapay zekâ isteği zaman aşımına uğradı. Daha kısa bir içerik veya daha hızlı bir model deneyin.");
        }
        catch (HttpRequestException ex)
        {
            throw new AiUnavailableException("Yapay zekâ sağlayıcısına ulaşılamadı.", ex);
        }
    }

    private static string? TryReadError(string body)
    {
        try { return JsonNode.Parse(body)?["error"]?["message"]?.GetValue<string>(); }
        catch (JsonException) { return null; }
    }

    public async Task<IReadOnlyList<AiModelInfo>> ListModelsAsync(CancellationToken ct)
    {
        if (_catalog is { } cached && DateTimeOffset.UtcNow - cached.At < TimeSpan.FromHours(1)) return cached.Models;

        await CatalogLock.WaitAsync(ct);
        try
        {
            if (_catalog is { } again && DateTimeOffset.UtcNow - again.At < TimeSpan.FromHours(1)) return again.Models;

            var json = await SendAsync(Request(HttpMethod.Get, "models"), TimeSpan.FromSeconds(30), ct);
            var models = new List<AiModelInfo>();
            foreach (var m in json["data"]?.AsArray() ?? [])
            {
                var id = m?["id"]?.GetValue<string>();
                if (id is null || id.StartsWith("openrouter/", StringComparison.Ordinal) || id.Contains("guard", StringComparison.OrdinalIgnoreCase))
                    continue;
                var outputs = m!["architecture"]?["output_modalities"]?.AsArray().Select(x => x?.GetValue<string>()).ToList() ?? [];
                models.Add(new AiModelInfo(id, m["name"]?.GetValue<string>() ?? id, outputs.Contains("image"),
                    PerMillion(m["pricing"]?["prompt"]), PerMillion(m["pricing"]?["completion"])));
            }
            models.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase));
            _catalog = (DateTimeOffset.UtcNow, models);
            return models;
        }
        finally
        {
            CatalogLock.Release();
        }
    }

    private static decimal? PerMillion(JsonNode? perToken) =>
        decimal.TryParse(perToken?.GetValue<string>(), NumberStyles.Float, CultureInfo.InvariantCulture, out var v) && v >= 0
            ? Math.Round(v * 1_000_000m, 4)
            : null;

    public async Task<AiChatResult> ChatAsync(AiChatRequest request, CancellationToken ct)
    {
        var body = new Dictionary<string, object>
        {
            ["model"] = request.Model,
            ["messages"] = new object[]
            {
                new { role = "system", content = request.System },
                new { role = "user", content = request.User },
            },
        };
        if (request.WebSearch) body["plugins"] = new object[] { new { id = "web", max_results = 10 } };

        var json = await SendAsync(Request(HttpMethod.Post, "chat/completions", body), request.Timeout ?? TimeSpan.FromMinutes(3), ct);
        var message = json["choices"]?[0]?["message"];
        var content = message?["content"]?.GetValue<string>();
        if (string.IsNullOrWhiteSpace(content)) throw new AiUnavailableException("Model boş yanıt döndürdü. Başka bir model deneyin.");

        // Web eklentisi ve Perplexity kaynakları "url_citation" açıklamalarıyla döner; aynı adres bir kez sayılır.
        var citations = new List<AiCitation>();
        foreach (var a in message?["annotations"]?.AsArray() ?? [])
        {
            var c = a?["url_citation"];
            var url = c?["url"]?.GetValue<string>();
            if (url is null || citations.Any(x => x.Url == url)) continue;
            citations.Add(new AiCitation(c?["title"]?.GetValue<string>() ?? url, url));
        }
        foreach (var url in json["citations"]?.AsArray().Select(x => x?.GetValue<string>()).OfType<string>() ?? [])
            if (citations.All(x => x.Url != url)) citations.Add(new AiCitation(url, url));

        return new AiChatResult(content, citations, json["model"]?.GetValue<string>() ?? request.Model);
    }

    public async Task<AiImageResult> GenerateImageAsync(string model, string prompt, CancellationToken ct)
    {
        var body = new
        {
            model,
            messages = new object[] { new { role = "user", content = prompt } },
            modalities = new[] { "image", "text" },
        };
        var json = await SendAsync(Request(HttpMethod.Post, "chat/completions", body), TimeSpan.FromMinutes(3), ct);
        var dataUrl = json["choices"]?[0]?["message"]?["images"]?[0]?["image_url"]?["url"]?.GetValue<string>();
        if (dataUrl is null || !dataUrl.StartsWith("data:", StringComparison.Ordinal))
            throw new AiUnavailableException("Model görsel döndürmedi. Görsel üretebilen bir model seçin.");

        var comma = dataUrl.IndexOf(',');
        var mime = dataUrl[5..dataUrl.IndexOf(';')];
        return new AiImageResult(Convert.FromBase64String(dataUrl[(comma + 1)..]), mime);
    }
}
