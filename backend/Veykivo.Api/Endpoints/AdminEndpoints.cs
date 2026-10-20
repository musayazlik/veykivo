using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Veykivo.Api.Infrastructure;
using Veykivo.Application.Contracts;
using Veykivo.Application.Services;
using Veykivo.Application.Services.Ai;
using Veykivo.Domain.Enums;
using Veykivo.Infrastructure.Identity;

namespace Veykivo.Api.Endpoints;

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var admin = app.MapGroup("/api/v1/admin")
            .WithTags("Admin")
            .RequireAuthorization(AuthPolicies.Panel)
            .AddEndpointFilter<ReadOnlyDemoFilter>()
            .AddEndpointFilter<AntiforgeryFilter>();

        admin.MapGet("/dashboard", (DashboardService s, CancellationToken ct) => s.GetDashboardAsync(ct))
            .WithName("AdminGetDashboard");

        MapServices(admin.MapGroup("/services"));
        MapProjects(admin.MapGroup("/projects"));
        MapTechnologies(admin.MapGroup("/technologies"));
        MapTeam(admin.MapGroup("/team"));
        MapPosts(admin.MapGroup("/posts"));
        MapBlogTaxonomy(admin);
        MapComments(admin.MapGroup("/comments"));
        MapAi(admin.MapGroup("/ai"));
        MapMedia(admin.MapGroup("/media"));
        MapInquiries(admin.MapGroup("/inquiries"));

        admin.MapGet("/site-settings", (SiteSettingsService s, CancellationToken ct) => s.GetAllAsync(ct))
            .WithName("AdminGetSiteSettings");
        admin.MapPut("/site-settings", (Dictionary<string, string> values, SiteSettingsService s, CancellationToken ct) =>
                s.UpdateAsync(values, ct))
            .WithName("AdminUpdateSiteSettings");

        return app;
    }

    private static void MapServices(RouteGroupBuilder g)
    {
        g.MapGet("/", (ServicesAdminService s, CancellationToken ct) => s.ListServicesAsync(ct)).WithName("AdminListServices");
        g.MapGet("/{id:guid}", (Guid id, ServicesAdminService s, CancellationToken ct) => s.GetServiceAsync(id, ct))
            .WithName("AdminGetService");
        g.MapPost("/", async (UpsertServiceRequest r, ServicesAdminService s, CancellationToken ct) =>
                TypedResults.Created($"/api/v1/admin/services", await s.SaveServiceAsync(null, r, ct)))
            .Validate<UpsertServiceRequest>().WithName("AdminCreateService");
        g.MapPut("/{id:guid}", (Guid id, UpsertServiceRequest r, ServicesAdminService s, CancellationToken ct) =>
                s.SaveServiceAsync(id, r, ct))
            .Validate<UpsertServiceRequest>().WithName("AdminUpdateService");
        g.MapDelete("/{id:guid}", async (Guid id, ServicesAdminService s, CancellationToken ct) =>
            {
                await s.DeleteServiceAsync(id, ct);
                return TypedResults.NoContent();
            }).WithName("AdminDeleteService");
    }

    private static void MapProjects(RouteGroupBuilder g)
    {
        g.MapGet("/", (ProjectsAdminService s, CancellationToken ct) => s.ListProjectsAsync(ct)).WithName("AdminListProjects");
        g.MapGet("/{id:guid}", (Guid id, ProjectsAdminService s, CancellationToken ct) => s.GetProjectAsync(id, ct))
            .WithName("AdminGetProject");
        g.MapPost("/", async (UpsertProjectRequest r, ProjectsAdminService s, CancellationToken ct) =>
                TypedResults.Created($"/api/v1/admin/projects", await s.SaveProjectAsync(null, r, ct)))
            .Validate<UpsertProjectRequest>().WithName("AdminCreateProject");
        g.MapPut("/{id:guid}", (Guid id, UpsertProjectRequest r, ProjectsAdminService s, CancellationToken ct) =>
                s.SaveProjectAsync(id, r, ct))
            .Validate<UpsertProjectRequest>().WithName("AdminUpdateProject");
        g.MapDelete("/{id:guid}", async (Guid id, ProjectsAdminService s, CancellationToken ct) =>
            {
                await s.DeleteProjectAsync(id, ct);
                return TypedResults.NoContent();
            }).WithName("AdminDeleteProject");
    }

    private static void MapTechnologies(RouteGroupBuilder g)
    {
        g.MapGet("/", (TechnologiesAdminService s, CancellationToken ct) => s.ListTechnologiesAsync(ct)).WithName("AdminListTechnologies");
        g.MapGet("/{id:guid}", (Guid id, TechnologiesAdminService s, CancellationToken ct) => s.GetTechnologyAsync(id, ct))
            .WithName("AdminGetTechnology");
        g.MapPost("/", async (UpsertTechnologyRequest r, TechnologiesAdminService s, CancellationToken ct) =>
                TypedResults.Created($"/api/v1/admin/technologies", await s.SaveTechnologyAsync(null, r, ct)))
            .Validate<UpsertTechnologyRequest>().WithName("AdminCreateTechnology");
        g.MapPut("/{id:guid}", (Guid id, UpsertTechnologyRequest r, TechnologiesAdminService s, CancellationToken ct) =>
                s.SaveTechnologyAsync(id, r, ct))
            .Validate<UpsertTechnologyRequest>().WithName("AdminUpdateTechnology");
        g.MapDelete("/{id:guid}", async (Guid id, TechnologiesAdminService s, CancellationToken ct) =>
            {
                await s.DeleteTechnologyAsync(id, ct);
                return TypedResults.NoContent();
            }).WithName("AdminDeleteTechnology");
    }

    private static void MapTeam(RouteGroupBuilder g)
    {
        g.MapGet("/", (TeamAdminService s, CancellationToken ct) => s.ListTeamAsync(ct)).WithName("AdminListTeam");
        g.MapGet("/{id:guid}", (Guid id, TeamAdminService s, CancellationToken ct) => s.GetTeamMemberAsync(id, ct))
            .WithName("AdminGetTeamMember");
        g.MapPost("/", async (UpsertTeamMemberRequest r, TeamAdminService s, CancellationToken ct) =>
                TypedResults.Created($"/api/v1/admin/team", await s.SaveTeamMemberAsync(null, r, ct)))
            .Validate<UpsertTeamMemberRequest>().WithName("AdminCreateTeamMember");
        g.MapPut("/{id:guid}", (Guid id, UpsertTeamMemberRequest r, TeamAdminService s, CancellationToken ct) =>
                s.SaveTeamMemberAsync(id, r, ct))
            .Validate<UpsertTeamMemberRequest>().WithName("AdminUpdateTeamMember");
        g.MapDelete("/{id:guid}", async (Guid id, TeamAdminService s, CancellationToken ct) =>
            {
                await s.DeleteTeamMemberAsync(id, ct);
                return TypedResults.NoContent();
            }).WithName("AdminDeleteTeamMember");
    }

    private static void MapPosts(RouteGroupBuilder g)
    {
        g.MapGet("/", (PostsAdminService s, CancellationToken ct) => s.ListPostsAsync(ct)).WithName("AdminListPosts");
        g.MapGet("/{id:guid}", (Guid id, PostsAdminService s, CancellationToken ct) => s.GetPostAsync(id, ct))
            .WithName("AdminGetPost");
        g.MapPost("/", async (UpsertPostRequest r, ClaimsPrincipal user, UserManager<AppUser> users, PostsAdminService s, CancellationToken ct) =>
                TypedResults.Created($"/api/v1/admin/posts", await s.SavePostAsync(null, r, await AuthorNameAsync(user, users), ct)))
            .Validate<UpsertPostRequest>().WithName("AdminCreatePost");
        g.MapPut("/{id:guid}", (Guid id, UpsertPostRequest r, PostsAdminService s, CancellationToken ct) =>
                s.SavePostAsync(id, r, null, ct))
            .Validate<UpsertPostRequest>().WithName("AdminUpdatePost");
        g.MapPatch("/{id:guid}", async (Guid id, QuickUpdatePostRequest r, PostsAdminService s, CancellationToken ct) =>
            {
                await s.QuickUpdateAsync(id, r, ct);
                return TypedResults.NoContent();
            }).WithName("AdminQuickUpdatePost");
        g.MapDelete("/{id:guid}", async (Guid id, PostsAdminService s, CancellationToken ct) =>
            {
                await s.DeletePostAsync(id, ct);
                return TypedResults.NoContent();
            }).WithName("AdminDeletePost");
    }

    private static void MapBlogTaxonomy(RouteGroupBuilder admin)
    {
        var c = admin.MapGroup("/categories");
        c.MapGet("/", (BlogTaxonomyService s, CancellationToken ct) => s.ListCategoriesAsync(ct)).WithName("AdminListCategories");
        c.MapPost("/", async (UpsertCategoryRequest r, BlogTaxonomyService s, CancellationToken ct) =>
                TypedResults.Created("/api/v1/admin/categories", await s.SaveCategoryAsync(null, r, ct)))
            .Validate<UpsertCategoryRequest>().WithName("AdminCreateCategory");
        c.MapPut("/{id:guid}", (Guid id, UpsertCategoryRequest r, BlogTaxonomyService s, CancellationToken ct) => s.SaveCategoryAsync(id, r, ct))
            .Validate<UpsertCategoryRequest>().WithName("AdminUpdateCategory");
        c.MapDelete("/{id:guid}", async (Guid id, BlogTaxonomyService s, CancellationToken ct) =>
            {
                await s.DeleteCategoryAsync(id, ct);
                return TypedResults.NoContent();
            }).WithName("AdminDeleteCategory");

        var t = admin.MapGroup("/tags");
        t.MapGet("/", (BlogTaxonomyService s, CancellationToken ct) => s.ListTagsAsync(ct)).WithName("AdminListTags");
        t.MapPost("/", async (UpsertTagRequest r, BlogTaxonomyService s, CancellationToken ct) =>
                TypedResults.Created("/api/v1/admin/tags", await s.SaveTagAsync(null, r, ct)))
            .Validate<UpsertTagRequest>().WithName("AdminCreateTag");
        t.MapPut("/{id:guid}", (Guid id, UpsertTagRequest r, BlogTaxonomyService s, CancellationToken ct) => s.SaveTagAsync(id, r, ct))
            .Validate<UpsertTagRequest>().WithName("AdminUpdateTag");
        t.MapDelete("/{id:guid}", async (Guid id, BlogTaxonomyService s, CancellationToken ct) =>
            {
                await s.DeleteTagAsync(id, ct);
                return TypedResults.NoContent();
            }).WithName("AdminDeleteTag");
    }

    private static void MapComments(RouteGroupBuilder g)
    {
        g.MapGet("/", (CommentStatus? status, string? q, int? page, int? pageSize, CommentService s, CancellationToken ct) =>
                s.ListAsync(status, q, page ?? 1, pageSize ?? 20, ct))
            .WithName("AdminListComments");
        g.MapPatch("/{id:guid}", async (Guid id, UpdateCommentStatusRequest r, CommentService s, CancellationToken ct) =>
            {
                await s.UpdateStatusAsync(id, r.Status, ct);
                return TypedResults.NoContent();
            }).Validate<UpdateCommentStatusRequest>().WithName("AdminUpdateCommentStatus");
        g.MapPost("/{id:guid}/reply", async (Guid id, ReplyCommentRequest r, ClaimsPrincipal user, UserManager<AppUser> users,
                CommentService s, CancellationToken ct) =>
            {
                await s.ReplyAsync(id, r.Body, await AuthorNameAsync(user, users) ?? "Veykivo", ct);
                return TypedResults.NoContent();
            }).Validate<ReplyCommentRequest>().WithName("AdminReplyComment");
        g.MapDelete("/{id:guid}", async (Guid id, CommentService s, CancellationToken ct) =>
            {
                await s.DeleteAsync(id, ct);
                return TypedResults.NoContent();
            }).WithName("AdminDeleteComment");
    }

    private static void MapAi(RouteGroupBuilder g)
    {
        g.MapGet("/models", (AiBlogService s, CancellationToken ct) => s.GetModelsAsync(ct)).WithName("AdminAiModels");
        g.MapPost("/generate-post", (AiGeneratePostRequest r, AiBlogService s, CancellationToken ct) => s.GeneratePostAsync(r, ct))
            .Validate<AiGeneratePostRequest>().RequireRateLimiting(RateLimitPolicies.Ai).WithName("AdminAiGeneratePost");
        g.MapPost("/rewrite", (AiRewriteRequest r, AiBlogService s, CancellationToken ct) => s.RewriteAsync(r, ct))
            .Validate<AiRewriteRequest>().RequireRateLimiting(RateLimitPolicies.Ai).WithName("AdminAiRewrite");
    }

    /// <summary>Yazı yazarı ve ekip yanıtı için oturumdaki kullanıcının görünen adı.</summary>
    private static async Task<string?> AuthorNameAsync(ClaimsPrincipal principal, UserManager<AppUser> users)
    {
        var user = await users.GetUserAsync(principal);
        return user?.DisplayName ?? user?.Email;
    }

    private static void MapMedia(RouteGroupBuilder g)
    {
        g.MapGet("/", (MediaService s, CancellationToken ct) => s.ListAsync(ct)).WithName("AdminListMedia");

        // CSRF doğrulaması grup filtresinde yapılır; yerleşik form antiforgery'si bu yüzden kapatıldı.
        g.MapPost("/", async (IFormFile file, [Microsoft.AspNetCore.Mvc.FromForm] string? altText, MediaService s, CancellationToken ct) =>
            {
                await using var stream = file.OpenReadStream();
                var asset = await s.UploadAsync(stream, file.FileName, file.ContentType, file.Length, altText, ct);
                return TypedResults.Created(asset.Url, asset);
            })
            .DisableAntiforgery()
            .WithMetadata(new Microsoft.AspNetCore.Mvc.RequestSizeLimitAttribute(MediaService.MaxBytes + 64 * 1024))
            .WithName("AdminUploadMedia");

        g.MapPatch("/{id:guid}", (Guid id, UpdateMediaRequest r, MediaService s, CancellationToken ct) =>
                s.UpdateAltAsync(id, r.AltText, ct))
            .Validate<UpdateMediaRequest>().WithName("AdminUpdateMedia");
        g.MapDelete("/{id:guid}", async (Guid id, MediaService s, CancellationToken ct) =>
            {
                await s.DeleteAsync(id, ct);
                return TypedResults.NoContent();
            }).WithName("AdminDeleteMedia");
    }

    private static void MapInquiries(RouteGroupBuilder g)
    {
        g.MapGet("/", (InquiryStatus? status, string? q, int? page, int? pageSize, InquiryService s, CancellationToken ct) =>
                s.ListAsync(status, q, page ?? 1, pageSize ?? 20, ct))
            .WithName("AdminListInquiries");
        g.MapGet("/{id:guid}", (Guid id, InquiryService s, CancellationToken ct) => s.GetAsync(id, ct))
            .WithName("AdminGetInquiry");
        g.MapPatch("/{id:guid}", (Guid id, UpdateInquiryStatusRequest r, InquiryService s, CancellationToken ct) =>
                s.UpdateStatusAsync(id, r.Status, ct))
            .Validate<UpdateInquiryStatusRequest>().WithName("AdminUpdateInquiryStatus");
    }
}
