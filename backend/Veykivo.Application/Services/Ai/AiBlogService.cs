using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Contracts;
using Veykivo.Domain.Entities;

namespace Veykivo.Application.Services.Ai;

/// <summary>
/// Blog yazarlığı için yapay zekâ akışı: (isteğe bağlı) web araştırması → JSON yazım → yapı kontrolü →
/// kaynakça → (isteğe bağlı) kapak görseli. Sonuç forma doldurulur; kayıt kullanıcı onayıyla yapılır.
/// </summary>
public sealed partial class AiBlogService(
    IAppDbContext db,
    IAiClient ai,
    IFileStorage storage,
    TimeProvider clock,
    IValidator<AiGeneratePostRequest> generateValidator,
    IValidator<AiRewriteRequest> rewriteValidator,
    ILogger<AiBlogService> logger)
{
    private static readonly Dictionary<string, string> LanguageNames = new()
    {
        ["tr"] = "Turkish (Türkçe)", ["en"] = "English", ["de"] = "German (Deutsch)",
    };

    private static readonly Dictionary<string, string> SourcesHeading = new()
    {
        ["tr"] = "Kaynakça", ["en"] = "Sources", ["de"] = "Quellen",
    };

    private static readonly Dictionary<string, string> StyleGuides = new()
    {
        ["informative"] = "Informative and clear: explain concepts plainly, use concrete examples.",
        ["conversational"] = "Conversational and warm: address the reader directly, keep sentences short.",
        ["persuasive"] = "Persuasive but honest: build a clear argument and end with a practical next step.",
        ["technical"] = "Technical and precise: assume a developer/IT audience, use correct terminology.",
    };

    private static readonly Dictionary<string, (int Words, int Headings)> DepthGuides = new()
    {
        ["concise"] = (450, 3), ["standard"] = (850, 5), ["in-depth"] = (1400, 6),
    };

    // ------------------------------------------------------------------ Modeller

    public async Task<AiModelsDto> GetModelsAsync(CancellationToken ct)
    {
        var defaults = await GetDefaultsAsync(ct);
        if (!ai.IsConfigured) return new AiModelsDto(false, [], [], defaults);

        var models = await ai.ListModelsAsync(ct);
        static AiModelDto Map(AiModelInfo m) => new(m.Id, m.Name, m.IsFree, m.PromptPricePerMillion, m.CompletionPricePerMillion);
        return new AiModelsDto(true,
            models.Where(m => !m.OutputsImage).Select(Map).ToList(),
            models.Where(m => m.OutputsImage).Select(Map).ToList(),
            defaults);
    }

    private async Task<AiDefaultsDto> GetDefaultsAsync(CancellationToken ct)
    {
        var s = await db.SiteSettings.AsNoTracking()
            .Where(x => x.Key.StartsWith("ai."))
            .ToDictionaryAsync(x => x.Key, x => x.Value, ct);
        string? Get(string key) => s.TryGetValue(key, out var v) && !string.IsNullOrWhiteSpace(v) ? v : null;

        return new AiDefaultsDto(
            Get(SiteSettingKeys.AiTextModel),
            Get(SiteSettingKeys.AiImageModel),
            Get(SiteSettingKeys.AiResearchModel),
            Get(SiteSettingKeys.AiStyle) is { } style && AiOptions.Styles.Contains(style) ? style : "informative",
            Get(SiteSettingKeys.AiDepth) is { } depth && AiOptions.Depths.Contains(depth) ? depth : "standard",
            Get(SiteSettingKeys.AiLanguage) is { } lang && AiOptions.Languages.Contains(lang) ? lang : "tr",
            Get(SiteSettingKeys.AiWebSearch) == "true");
    }

    /// <summary>Sıra: istekte seçilen → panel ayarı → katalogdaki ilk yedek model → ilk ücretsiz model.</summary>
    private async Task<string> ResolveModelAsync(string? requested, string? configured, string[] fallbacks, bool image, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(requested)) return requested;
        if (!string.IsNullOrWhiteSpace(configured)) return configured;

        var catalog = (await ai.ListModelsAsync(ct)).Where(m => m.OutputsImage == image).ToList();
        return fallbacks.FirstOrDefault(f => catalog.Any(m => m.Id == f))
               ?? catalog.FirstOrDefault(m => m.IsFree)?.Id
               ?? catalog.FirstOrDefault()?.Id
               ?? throw new AiUnavailableException("Kullanılabilir bir yapay zekâ modeli bulunamadı.");
    }

    // ------------------------------------------------------------------ Yazı üretimi

    public async Task<AiGeneratePostResult> GeneratePostAsync(AiGeneratePostRequest r, CancellationToken ct)
    {
        await generateValidator.ValidateAndThrowAsync(r, ct);
        EnsureConfigured();

        var defaults = await GetDefaultsAsync(ct);
        var language = r.Language ?? defaults.Language;
        var style = r.Style ?? defaults.Style;
        var depth = r.Depth ?? defaults.Depth;
        var webSearch = r.WebSearch ?? defaults.WebSearch;
        var model = await ResolveModelAsync(r.Model, defaults.TextModel, AiOptions.FallbackTextModels, image: false, ct);
        var warnings = new List<string>();

        var categories = await db.Categories.AsNoTracking().OrderBy(c => c.Name).Select(c => c.Name).ToListAsync(ct);
        var tags = await db.Tags.AsNoTracking().OrderBy(t => t.Name).Select(t => t.Name).Take(200).ToListAsync(ct);

        // 1) Araştırma (isteğe bağlı): kaynak bulunamazsa yazı üretilmez; uydurma bilgi riskine girilmez.
        string? notes = null;
        IReadOnlyList<AiCitation> sources = [];
        if (webSearch && (r.Fields.Content || r.Fields.Excerpt || r.Fields.Title))
        {
            var researchModel = defaults.ResearchModel is null or "" ? AiOptions.DefaultResearchModel
                : defaults.ResearchModel == AiOptions.NativeResearch ? model : defaults.ResearchModel;
            (notes, sources) = await ResearchAsync(r.Topic, researchModel, ct);
        }

        // 2) Yazım
        var needsText = r.Fields.Title || r.Fields.Excerpt || r.Fields.Content || r.Fields.Seo || r.Fields.Category || r.Fields.Tags;
        JsonElement? json = null;
        if (needsText)
        {
            var system = BuildWriterSystemPrompt(r.Fields, language, style, depth, notes is not null, r.Fields.Cover);
            var user = BuildWriterUserPrompt(r.Topic, notes, sources, categories, tags);
            var result = await ai.ChatAsync(new AiChatRequest(model, system, user), ct);
            json = ParseJson(result.Text);

            var minHeadings = DepthGuides[depth].Headings;
            if (r.Fields.Content && CountHeadings(Str(json, "content")) < minHeadings)
            {
                // Yapı şartı sağlanmadıysa bir kez daha dene.
                var retry = await ai.ChatAsync(new AiChatRequest(model, system,
                    user + $"\n\nYour previous draft did not meet the structure requirement: the content must contain at least {minHeadings} '##' subheadings. Rewrite the full JSON object now."), ct);
                var retried = ParseJson(retry.Text);
                if (CountHeadings(Str(retried, "content")) >= CountHeadings(Str(json, "content"))) json = retried;
                if (CountHeadings(Str(json, "content")) < minHeadings)
                    warnings.Add($"İçerik önerilen {minHeadings} alt başlıktan az başlık içeriyor.");
            }
        }

        var title = r.Fields.Title ? Truncate(Str(json, "title"), 200) : null;
        var excerpt = r.Fields.Excerpt ? Truncate(StripMarkers(Str(json, "excerpt")), 400) : null;
        var content = r.Fields.Content ? Str(json, "content") : null;
        if (content is not null)
        {
            content = NormalizeHeadings(content);
            content = LinkCitations(content, sources);
            if (sources.Count > 0) content += BuildBibliography(sources, language);
        }

        var seoTitle = r.Fields.Seo ? Truncate(StripMarkers(Str(json, "seoTitle")), 70) : null;
        var seoDescription = r.Fields.Seo ? Truncate(StripMarkers(Str(json, "seoDescription")), 170) : null;
        var category = r.Fields.Category ? Truncate(Str(json, "category"), 60) : null;
        var tagList = r.Fields.Tags && json is { } j && j.TryGetProperty("tags", out var t) && t.ValueKind == JsonValueKind.Array
            ? t.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.String).Select(x => x.GetString()!.Trim().ToLowerInvariant())
                .Where(x => x.Length is > 0 and <= 40).Distinct().Take(5).ToList()
            : [];

        // 3) Kapak görseli (isteğe bağlı): hata olursa yazı yine döner, uyarı eklenir.
        MediaAssetDto? cover = null;
        if (r.Fields.Cover)
        {
            try
            {
                var imageModel = await ResolveModelAsync(r.ImageModel, defaults.ImageModel, AiOptions.FallbackImageModels, image: true, ct);
                var scene = Str(json, "coverPrompt") ?? excerpt ?? title ?? r.Topic;
                cover = await GenerateCoverAsync(imageModel, scene, title ?? r.Topic, ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Kapak görseli üretilemedi.");
                warnings.Add("Kapak görseli üretilemedi; yazı içeriği yine de hazır.");
            }
        }

        return new AiGeneratePostResult(title, excerpt, content, seoTitle, seoDescription, category, tagList, cover,
            sources.Select((s, i) => new AiSourceDto(i + 1, s.Title, s.Url)).ToList(), warnings, model);
    }

    private async Task<(string Notes, IReadOnlyList<AiCitation> Sources)> ResearchAsync(string topic, string model, CancellationToken ct)
    {
        var today = clock.GetUtcNow().ToString("yyyy-MM-dd");
        var system = $"""
            You are a meticulous research assistant. Today is {today}.
            Search the web for the topic below and write detailed research notes in English.
            Put a source marker like [1] directly after every fact, numbered by the order of the sources you used.
            Prefer primary and authoritative sources (official docs, standards bodies, reputable publications).
            If something cannot be verified, say so instead of guessing.
            """;
        var result = await ai.ChatAsync(new AiChatRequest(model, system, $"Topic / brief:\n{topic}",
            WebSearch: !model.StartsWith("perplexity/", StringComparison.Ordinal), Timeout: TimeSpan.FromMinutes(4)), ct);

        if (result.Citations.Count == 0)
            throw new AiUnavailableException("Web araştırması kaynak döndürmedi; doğrulanmamış içerik üretmemek için yazı oluşturulmadı. Araştırmayı kapatıp tekrar deneyin.");
        return (result.Text, result.Citations);
    }

    private static string BuildWriterSystemPrompt(AiGenerateFields f, string language, string style, string depth, bool withResearch, bool withCover)
    {
        var (words, headings) = DepthGuides[depth];
        var keys = new List<string>();
        if (f.Title) keys.Add("\"title\": an engaging SEO headline, max 60 characters");
        if (f.Excerpt) keys.Add("\"excerpt\": a 1–2 sentence summary for listings, max 160 characters");
        if (f.Content) keys.Add($"\"content\": the article in Markdown, about {words} words, a short intro, AT LEAST {headings} '##' subheadings ('###' allowed, never '#'), short paragraphs, bullet lists where useful, and a closing takeaway. No bibliography section.");
        if (f.Seo) keys.Add("\"seoTitle\": max 60 characters; \"seoDescription\": a compelling meta description, max 155 characters");
        if (f.Category) keys.Add("\"category\": reuse one of the existing categories if it fits, otherwise coin a new one of 1–3 words");
        if (f.Tags) keys.Add("\"tags\": up to 5 short lowercase tags, prefer existing ones");
        if (withCover) keys.Add("\"coverPrompt\": one visual scene for a cover illustration, max 15 words, no text in the image");

        var sb = new StringBuilder();
        sb.AppendLine("You write blog content for Veykivo, a software company in Türkiye that builds custom enterprise software:");
        sb.AppendLine("web and mobile applications, ERP/CRM systems, AI and automation, and software consulting.");
        sb.AppendLine("Audience: business owners, operations managers and IT leads at SMEs and enterprises. Be practical and specific; avoid hype and buzzwords.");
        sb.AppendLine($"Write in {LanguageNames[language]}. Style: {StyleGuides[style]}");
        sb.AppendLine(withResearch
            ? "Base every factual statement on the research notes and cite with the same number in square brackets, e.g. [2]. Use at most two numbers per statement. Never invent facts, statistics, dates or quotes."
            : "Do not invent statistics, dates, product versions, customer names or quotes. Prefer general, verifiable guidance.");
        sb.AppendLine("Return ONLY a minified JSON object (no code fences, no commentary) with exactly these keys:");
        foreach (var k in keys) sb.AppendLine($"- {k}");
        return sb.ToString();
    }

    private static string BuildWriterUserPrompt(string topic, string? notes, IReadOnlyList<AiCitation> sources,
        IReadOnlyList<string> categories, IReadOnlyList<string> tags)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Topic / brief:\n{topic}");
        if (notes is not null)
        {
            sb.AppendLine($"\nResearch notes:\n{notes}");
            sb.AppendLine("\nSources:");
            for (var i = 0; i < sources.Count; i++) sb.AppendLine($"[{i + 1}] {sources[i].Title} — {sources[i].Url}");
        }
        sb.AppendLine($"\nExisting categories: {(categories.Count > 0 ? string.Join(", ", categories) : "(none)")}");
        sb.AppendLine($"Existing tags: {(tags.Count > 0 ? string.Join(", ", tags) : "(none)")}");
        sb.AppendLine("\nWrite the JSON object now.");
        return sb.ToString();
    }

    private async Task<MediaAssetDto> GenerateCoverAsync(string model, string scene, string title, CancellationToken ct)
    {
        var prompt = $"""
            Wordless conceptual blog cover illustration. Visual metaphor for: {scene}.
            Clean, modern flat vector illustration with subtle technical-blueprint details, generous negative space, 16:9 landscape.
            Palette: deep petrol #0E2A2F, sodium amber #F2B134, teal #2F6F6A on light chalk #F2F5F4.
            Absolutely no text, letters, numbers, logos or watermarks.
            """;
        var image = await ai.GenerateImageAsync(model, prompt, ct);
        var extension = image.MimeType switch { "image/png" => ".png", "image/webp" => ".webp", _ => ".jpg" };
        if (!MediaService.HasValidSignature(image.Bytes.AsSpan(0, Math.Min(image.Bytes.Length, 32)), image.MimeType))
            throw new AiUnavailableException("Model geçerli bir görsel döndürmedi.");

        using var stream = new MemoryStream(image.Bytes);
        var stored = await storage.SaveAsync(stream, extension, image.MimeType, ct);
        var asset = new MediaAsset
        {
            StorageKey = stored.StorageKey,
            Url = stored.Url,
            MimeType = image.MimeType,
            SizeBytes = image.Bytes.LongLength,
            AltText = Truncate($"{title} için kapak görseli", 300)!,
        };
        db.MediaAssets.Add(asset);
        await db.SaveChangesAsync(ct);
        return new MediaAssetDto(asset.Id, asset.Url, asset.AltText, asset.MimeType, asset.SizeBytes, asset.CreatedAt);
    }

    // ------------------------------------------------------------------ Yeniden yazma

    public async Task<AiRewriteResult> RewriteAsync(AiRewriteRequest r, CancellationToken ct)
    {
        await rewriteValidator.ValidateAndThrowAsync(r, ct);
        EnsureConfigured();
        var defaults = await GetDefaultsAsync(ct);
        var model = await ResolveModelAsync(r.Model, defaults.TextModel, AiOptions.FallbackTextModels, image: false, ct);
        var language = r.Language ?? defaults.Language;

        var keys = new List<string>();
        var input = new StringBuilder();
        if (!string.IsNullOrWhiteSpace(r.Title)) { keys.Add("\"title\" (max 60 characters)"); input.AppendLine($"TITLE:\n{r.Title}\n"); }
        if (!string.IsNullOrWhiteSpace(r.Excerpt)) { keys.Add("\"excerpt\" (max 160 characters)"); input.AppendLine($"EXCERPT:\n{r.Excerpt}\n"); }
        if (!string.IsNullOrWhiteSpace(r.Content)) { keys.Add("\"content\" (Markdown, keep '##' structure, never '#')"); input.AppendLine($"CONTENT (Markdown):\n{r.Content}\n"); }

        var system = $"""
            You are a senior editor for Veykivo's company blog (custom enterprise software, Türkiye).
            Apply the editor's instruction to the given fields. Keep facts, numbers, links and citation markers like [1](url) intact
            unless the instruction explicitly asks otherwise. Keep any "Kaynakça"/"Sources"/"Quellen" section unchanged.
            Output language: {LanguageNames[language]} unless the instruction asks for a translation.
            Return ONLY a minified JSON object with exactly these keys: {string.Join(", ", keys)}.
            """;
        var result = await ai.ChatAsync(new AiChatRequest(model, system, $"Instruction: {r.Instruction}\n\n{input}"), ct);
        var json = ParseJson(result.Text);

        return new AiRewriteResult(
            string.IsNullOrWhiteSpace(r.Title) ? null : Truncate(Str(json, "title"), 200),
            string.IsNullOrWhiteSpace(r.Excerpt) ? null : Truncate(Str(json, "excerpt"), 400),
            string.IsNullOrWhiteSpace(r.Content) ? null : NormalizeHeadings(Str(json, "content") ?? r.Content!),
            model);
    }

    // ------------------------------------------------------------------ Yardımcılar

    private void EnsureConfigured()
    {
        if (!ai.IsConfigured)
            throw new AiUnavailableException("Yapay zekâ servisi yapılandırılmamış. Sunucuda OpenRouter__ApiKey ortam değişkenini tanımlayın.");
    }

    /// <summary>Model yanıtındaki ilk JSON nesnesini çıkarır (kod bloğu veya açıklama metni olsa bile).</summary>
    internal static JsonElement ParseJson(string text)
    {
        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        if (start < 0 || end <= start) throw new AiUnavailableException("Model beklenen JSON yanıtını döndürmedi. Tekrar deneyin veya başka bir model seçin.");
        try
        {
            using var doc = JsonDocument.Parse(text[start..(end + 1)]);
            return doc.RootElement.Clone();
        }
        catch (JsonException ex)
        {
            throw new AiUnavailableException("Model yanıtı okunamadı. Tekrar deneyin veya başka bir model seçin.", ex);
        }
    }

    private static string? Str(JsonElement? json, string key) =>
        json is { } j && j.TryGetProperty(key, out var v) && v.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(v.GetString())
            ? v.GetString()!.Trim()
            : null;

    private static string? Truncate(string? value, int max) =>
        value is null ? null : value.Length <= max ? value : value[..max].TrimEnd();

    internal static int CountHeadings(string? markdown) => markdown is null ? 0 : H2().Matches(markdown).Count;

    /// <summary>"# Başlık" sayfa başlığıyla çakışmasın diye ## seviyesine indirilir.</summary>
    internal static string NormalizeHeadings(string markdown) => H1().Replace(markdown, "## ");

    private static string? StripMarkers(string? text) => text is null ? null : Marker().Replace(text, "").Trim();

    /// <summary>[3] işaretlerini kaynağa bağlantıya çevirir; bilinmeyen numaralar kaldırılır.</summary>
    internal static string LinkCitations(string markdown, IReadOnlyList<AiCitation> sources) =>
        Marker().Replace(markdown, m =>
        {
            var n = int.Parse(m.Groups[1].Value);
            return n >= 1 && n <= sources.Count ? $"[[{n}]]({sources[n - 1].Url})" : "";
        });

    private static string BuildBibliography(IReadOnlyList<AiCitation> sources, string language)
    {
        var sb = new StringBuilder($"\n\n## {SourcesHeading[language]}\n\n");
        for (var i = 0; i < sources.Count; i++)
            sb.AppendLine($"{i + 1}. [{(string.IsNullOrWhiteSpace(sources[i].Title) ? sources[i].Url : sources[i].Title)}]({sources[i].Url})");
        return sb.ToString();
    }

    [GeneratedRegex(@"^##\s+\S", RegexOptions.Multiline)]
    private static partial Regex H2();

    [GeneratedRegex(@"^#\s+", RegexOptions.Multiline)]
    private static partial Regex H1();

    // [12] işaretini yakalar; zaten bağlantıya çevrilmiş [[12]](...) biçimine dokunmaz.
    [GeneratedRegex(@"(?<!\[)\[(\d{1,2})\](?!\]|\()")]
    private static partial Regex Marker();
}
