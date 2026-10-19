namespace Veykivo.Application.Services.Ai;

/// <summary>OpenRouter (OpenAI uyumlu) sohbet ve görsel üretim istemcisi. Altyapı katmanında uygulanır.</summary>
public interface IAiClient
{
    bool IsConfigured { get; }
    Task<IReadOnlyList<AiModelInfo>> ListModelsAsync(CancellationToken ct);
    Task<AiChatResult> ChatAsync(AiChatRequest request, CancellationToken ct);
    Task<AiImageResult> GenerateImageAsync(string model, string prompt, CancellationToken ct);
}

public sealed record AiModelInfo(string Id, string Name, bool OutputsImage, decimal? PromptPricePerMillion, decimal? CompletionPricePerMillion)
{
    public bool IsFree => PromptPricePerMillion == 0 && CompletionPricePerMillion == 0;
}

public sealed record AiChatRequest(string Model, string System, string User, bool WebSearch = false, TimeSpan? Timeout = null);

public sealed record AiCitation(string Title, string Url);

public sealed record AiChatResult(string Text, IReadOnlyList<AiCitation> Citations, string Model);

public sealed record AiImageResult(byte[] Bytes, string MimeType);

/// <summary>Yapay zekâ servisi yapılandırılmamış veya sağlayıcı hata döndürdüğünde fırlatılır.</summary>
public sealed class AiUnavailableException(string message, Exception? inner = null) : Exception(message, inner);

public static class AiOptions
{
    public static readonly IReadOnlySet<string> Styles = new HashSet<string> { "informative", "conversational", "persuasive", "technical" };
    public static readonly IReadOnlySet<string> Depths = new HashSet<string> { "concise", "standard", "in-depth" };
    public static readonly IReadOnlySet<string> Languages = new HashSet<string> { "tr", "en", "de" };

    /// <summary>Panelde model seçilmezse sırayla denenir; katalogda ilk bulunan kullanılır.</summary>
    public static readonly string[] FallbackTextModels =
        ["openai/gpt-5-mini", "google/gemini-2.5-flash", "openai/gpt-4o-mini", "anthropic/claude-haiku-4.5"];

    public static readonly string[] FallbackImageModels =
        ["google/gemini-2.5-flash-image", "google/gemini-3.1-flash-image", "openai/gpt-image-1-mini"];

    public const string DefaultResearchModel = "perplexity/sonar-pro";
    /// <summary>Araştırma modeli olarak bu değer seçilirse yazım modeli web eklentisiyle araştırır.</summary>
    public const string NativeResearch = "native";
}
