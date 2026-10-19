using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Veykivo.Application.Common;

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount)
{
    public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
}

public sealed class NotFoundException(string message) : Exception(message);

public sealed class ConflictException(string message) : Exception(message);

public sealed class BadRequestException(string message) : Exception(message);

public static partial class Slug
{
    private static readonly Dictionary<char, string> TurkishMap = new()
    {
        ['ç'] = "c", ['ğ'] = "g", ['ı'] = "i", ['İ'] = "i", ['ö'] = "o", ['ş'] = "s", ['ü'] = "u",
        ['Ç'] = "c", ['Ğ'] = "g", ['Ö'] = "o", ['Ş'] = "s", ['Ü'] = "u", ['â'] = "a", ['î'] = "i", ['û'] = "u",
    };

    /// <summary>"Özel Yazılım Geliştirme" → "ozel-yazilim-gelistirme"</summary>
    public static string From(string input)
    {
        var sb = new StringBuilder(input.Length);
        foreach (var ch in input.Trim())
            sb.Append(TurkishMap.TryGetValue(ch, out var r) ? r : ch.ToString());

        var normalized = sb.ToString().Normalize(NormalizationForm.FormD);
        var ascii = new StringBuilder(normalized.Length);
        foreach (var ch in normalized)
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                ascii.Append(ch);

        var lower = ascii.ToString().ToLowerInvariant();
        var dashed = NonAlphanumeric().Replace(lower, "-");
        return dashed.Trim('-');
    }

    public static bool IsValid(string slug) => ValidSlug().IsMatch(slug);

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonAlphanumeric();

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex ValidSlug();
}
