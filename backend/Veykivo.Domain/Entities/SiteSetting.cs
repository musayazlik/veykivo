namespace Veykivo.Domain.Entities;

public class SiteSetting
{
    public required string Key { get; set; }
    public string Value { get; set; } = string.Empty;
}

/// <summary>Bilinen ayar anahtarları. Public olanlar ziyaretçiye açık API'den döner.</summary>
public static class SiteSettingKeys
{
    public const string CompanyName = "company.name";
    public const string CompanyTagline = "company.tagline";
    public const string ContactEmail = "contact.email";
    public const string ContactPhone = "contact.phone";
    public const string ContactAddress = "contact.address";
    public const string WorkingHours = "contact.workingHours";
    public const string SocialLinkedIn = "social.linkedin";
    public const string SocialGitHub = "social.github";
    public const string SocialInstagram = "social.instagram";
    public const string SocialX = "social.x";
    public const string SeoDefaultTitle = "seo.defaultTitle";
    public const string SeoDefaultDescription = "seo.defaultDescription";
    public const string NotificationEmail = "notifications.inquiryEmail";
    public const string AiTextModel = "ai.textModel";
    public const string AiImageModel = "ai.imageModel";
    public const string AiResearchModel = "ai.researchModel";
    public const string AiStyle = "ai.style";
    public const string AiDepth = "ai.depth";
    public const string AiLanguage = "ai.language";
    public const string AiWebSearch = "ai.webSearch";

    public static readonly IReadOnlySet<string> Public = new HashSet<string>
    {
        CompanyName, CompanyTagline, ContactEmail, ContactPhone, ContactAddress, WorkingHours,
        SocialLinkedIn, SocialGitHub, SocialInstagram, SocialX, SeoDefaultTitle, SeoDefaultDescription,
    };

    public static readonly IReadOnlySet<string> All = new HashSet<string>(Public)
    {
        NotificationEmail, AiTextModel, AiImageModel, AiResearchModel, AiStyle, AiDepth, AiLanguage, AiWebSearch,
    };
}
