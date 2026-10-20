using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Veykivo.Application.Services.Ai;
using Veykivo.Infrastructure.Ai;

namespace Veykivo.Tests;

/// <summary>OpenRouter istemcisinin bozuk sağlayıcı yanıtlarına dayanıklılığını ve citation filtresini sınar.</summary>
public sealed class OpenRouterClientTests
{
    private sealed class StubHandler(string json) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(json, Encoding.UTF8, "application/json") });
    }

    private static OpenRouterClient CreateClient(string json) =>
        new(new HttpClient(new StubHandler(json)),
            Options.Create(new OpenRouterOptions { ApiKey = "test-key", BaseUrl = "http://localhost/" }),
            NullLogger<OpenRouterClient>.Instance);

    private static readonly byte[] PngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    [Fact]
    public async Task Valid_image_data_url_is_decoded()
    {
        var dataUrl = "data:image/png;base64," + Convert.ToBase64String(PngHeader);
        var client = CreateClient("""{"choices":[{"message":{"images":[{"image_url":{"url":"__DATA_URL__"}}]}}]}"""
            .Replace("__DATA_URL__", dataUrl));

        var image = await client.GenerateImageAsync("m", "prompt", default);

        Assert.Equal("image/png", image.MimeType);
        Assert.Equal(PngHeader, image.Bytes);
    }

    [Theory]
    // Virgül yok, desteklenmeyen biçim, bozuk base64: hepsi planlanmış 503 olmalı, 500 değil.
    [InlineData("""{"choices":[{"message":{"images":[{"image_url":{"url":"data:image/png"}}]}}]}""")]
    [InlineData("""{"choices":[{"message":{"images":[{"image_url":{"url":"data:image/gif;base64,AAAA"}}]}}]}""")]
    [InlineData("""{"choices":[{"message":{"images":[{"image_url":{"url":"data:image/png;base64,!!!"}}]}}]}""")]
    public async Task Malformed_image_data_url_returns_ai_unavailable(string json)
    {
        var client = CreateClient(json);

        await Assert.ThrowsAsync<AiUnavailableException>(() => client.GenerateImageAsync("m", "prompt", default));
    }

    [Fact]
    public async Task Citations_keep_only_http_urls()
    {
        var client = CreateClient("""
            {"choices":[{"message":{"content":"ok","annotations":[
                {"url_citation":{"title":"Kötü","url":"javascript:alert(1)"}},
                {"url_citation":{"title":"İyi","url":"https://ornek.example/kaynak"}},
                {"url_citation":{"title":"Göreli","url":"/kaynak"}}]},"model":"m"}],"citations":["ftp://ftp.example/x"]}
            """);

        var result = await client.ChatAsync(new AiChatRequest("m", "s", "u"), default);

        var citation = Assert.Single(result.Citations);
        Assert.Equal("https://ornek.example/kaynak", citation.Url);
    }
}
