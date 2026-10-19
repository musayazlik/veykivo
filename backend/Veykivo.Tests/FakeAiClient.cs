using Veykivo.Application.Services.Ai;

namespace Veykivo.Tests;

/// <summary>OpenRouter yerine sırayla önceden verilen yanıtları döndüren test istemcisi.</summary>
public sealed class FakeAiClient : IAiClient
{
    public Queue<AiChatResult> Responses { get; } = new();
    public List<AiChatRequest> Requests { get; } = [];
    public bool IsConfigured { get; set; } = true;

    public Task<IReadOnlyList<AiModelInfo>> ListModelsAsync(CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<AiModelInfo>>(
        [
            new AiModelInfo("openai/gpt-5-mini", "GPT-5 mini", false, 0.25m, 2m),
            new AiModelInfo("perplexity/sonar-pro", "Sonar Pro", false, 3m, 15m),
            new AiModelInfo("google/gemini-2.5-flash-image", "Gemini Image", true, 0.3m, 2.5m),
        ]);

    public Task<AiChatResult> ChatAsync(AiChatRequest request, CancellationToken ct)
    {
        Requests.Add(request);
        return Task.FromResult(Responses.Count > 0
            ? Responses.Dequeue()
            : throw new InvalidOperationException("Beklenmeyen AI çağrısı."));
    }

    public Task<AiImageResult> GenerateImageAsync(string model, string prompt, CancellationToken ct) =>
        throw new AiUnavailableException("Testte görsel üretimi yok.");
}
