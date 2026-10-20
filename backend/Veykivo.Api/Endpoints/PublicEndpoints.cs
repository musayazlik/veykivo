using Veykivo.Api.Infrastructure;
using Veykivo.Application.Contracts;
using Veykivo.Application.Services;

namespace Veykivo.Api.Endpoints;

public static class PublicEndpoints
{
    public static IEndpointRouteBuilder MapPublicEndpoints(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api/v1").WithTags("Public");

        api.MapGet("/services", (PublicContentService s, CancellationToken ct) => s.GetServicesAsync(ct))
            .WithName("GetServices");
        api.MapGet("/services/{slug}", (string slug, PublicContentService s, CancellationToken ct) => s.GetServiceAsync(slug, ct))
            .WithName("GetService").ProducesProblem(404);

        api.MapGet("/projects", (bool? featured, int? limit, PublicContentService s, CancellationToken ct) =>
                s.GetProjectsAsync(featured, limit, ct))
            .WithName("GetProjects");
        api.MapGet("/projects/{slug}", (string slug, PublicContentService s, CancellationToken ct) => s.GetProjectAsync(slug, ct))
            .WithName("GetProject").ProducesProblem(404);

        api.MapGet("/team", (PublicContentService s, CancellationToken ct) => s.GetTeamAsync(ct)).WithName("GetTeam");
        api.MapGet("/technologies", (PublicContentService s, CancellationToken ct) => s.GetTechnologiesAsync(ct))
            .WithName("GetTechnologies");

        api.MapGet("/posts", (int? page, int? pageSize, string? category, string? tag, string? q, bool? featured,
                PublicContentService s, CancellationToken ct) =>
                s.GetPostsAsync(page ?? 1, pageSize ?? 9, category, tag, q, featured, ct))
            .WithName("GetPosts");
        api.MapGet("/blog/categories", (PublicContentService s, CancellationToken ct) => s.GetBlogCategoriesAsync(ct))
            .WithName("GetBlogCategories");
        api.MapGet("/blog/tags", (PublicContentService s, CancellationToken ct) => s.GetBlogTagsAsync(ct))
            .WithName("GetBlogTags");
        // Doğrulama filtresi yerine servis katmanında yapılır: honeypot dolu istekler
        // alan hataları almadan sessizce kabul edilsin (CommentService/InquiryService).
        api.MapPost("/posts/{slug}/comments", async (string slug, CreateCommentRequest request, CommentService s, CancellationToken ct) =>
                TypedResults.Accepted((string?)null, await s.CreateAsync(slug, request, ct)))
            .ProducesValidationProblem()
            .RequireRateLimiting(RateLimitPolicies.Comment)
            .ProducesProblem(404)
            .WithName("CreateComment");
        api.MapGet("/posts/{slug}", (string slug, PublicContentService s, CancellationToken ct) => s.GetPostAsync(slug, ct))
            .WithName("GetPost").ProducesProblem(404);

        api.MapGet("/site-settings/public", (PublicContentService s, CancellationToken ct) => s.GetPublicSettingsAsync(ct))
            .WithName("GetPublicSiteSettings");
        api.MapGet("/sitemap", (PublicContentService s, CancellationToken ct) => s.GetSitemapAsync(ct))
            .WithName("GetSitemap");

        api.MapPost("/inquiries", async (CreateInquiryRequest request, InquiryService s, CancellationToken ct) =>
            {
                var created = await s.CreateAsync(request, ct);
                return TypedResults.Accepted((string?)null, created);
            })
            .ProducesValidationProblem()
            .RequireRateLimiting(RateLimitPolicies.Inquiry)
            .WithName("CreateInquiry");

        return app;
    }
}
