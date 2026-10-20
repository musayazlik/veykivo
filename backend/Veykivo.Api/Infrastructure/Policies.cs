namespace Veykivo.Api.Infrastructure;

public static class AuthPolicies
{
    /// <summary>Admin ve Demo rolleri; Demo'nun yazma istekleri ayrıca <see cref="ReadOnlyDemoFilter"/> ile reddedilir.</summary>
    public const string Panel = "PanelAccess";
}

public static class RateLimitPolicies
{
    public const string Inquiry = "inquiry";
    public const string Login = "login";
    public const string Comment = "comment";
    public const string Ai = "ai";
    public const string Health = "health";
}
