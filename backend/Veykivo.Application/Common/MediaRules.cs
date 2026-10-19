namespace Veykivo.Application.Common;

public static class MediaRules
{
    public const int MaxAltTextLength = 300;

    public static string NormalizeAltText(string? value, bool allowNull = false)
    {
        if (value is null && !allowNull) throw new BadRequestException("Görsel açıklaması null olamaz.");
        if (value?.Length > MaxAltTextLength) throw new BadRequestException("Görsel açıklaması en fazla 300 karakter olabilir.");
        return value?.Trim() ?? string.Empty;
    }
}
