namespace Veykivo.Api.Infrastructure;

public static class AuthPolicies
{
    public const string Admin = "AdminOnly";
}

public static class RateLimitPolicies
{
    public const string Inquiry = "inquiry";
    public const string Login = "login";
    public const string Comment = "comment";
    public const string Ai = "ai";
}
