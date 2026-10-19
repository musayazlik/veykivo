using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Veykivo.Domain.Entities;
using Veykivo.Domain.Enums;
using Veykivo.Infrastructure.Persistence;

namespace Veykivo.Tests;

public sealed class ApiTests : IClassFixture<TestApp>
{
    private readonly TestApp _app;

    public ApiTests(TestApp app) => _app = app;

    [Fact]
    public async Task Public_services_hide_drafts()
    {
        await _app.SeedAsync(db =>
        {
            db.Services.Add(new Service { Slug = "yayinda-hizmet", Title = "Yayında", Summary = "Ö", IsPublished = true });
            db.Services.Add(new Service { Slug = "taslak-hizmet", Title = "Taslak", Summary = "Ö", IsPublished = false });
            return Task.CompletedTask;
        });
        var client = _app.CreateClient();

        var list = await client.GetFromJsonAsync<JsonElement>("/api/v1/services");
        var slugs = list.EnumerateArray().Select(s => s.GetProperty("slug").GetString()).ToList();

        Assert.Contains("yayinda-hizmet", slugs);
        Assert.DoesNotContain("taslak-hizmet", slugs);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/v1/services/taslak-hizmet")).StatusCode);
    }

    [Fact]
    public async Task Scheduled_and_draft_posts_are_not_public()
    {
        var now = DateTimeOffset.UtcNow;
        await _app.SeedAsync(db =>
        {
            db.Posts.Add(new Post { Slug = "gecmis", Title = "G", Excerpt = "E", Status = PostStatus.Published, PublishedAt = now.AddDays(-1) });
            db.Posts.Add(new Post { Slug = "gelecek", Title = "P", Excerpt = "E", Status = PostStatus.Published, PublishedAt = now.AddDays(3) });
            db.Posts.Add(new Post { Slug = "taslak", Title = "T", Excerpt = "E", Status = PostStatus.Draft, PublishedAt = now.AddDays(-1) });
            return Task.CompletedTask;
        });
        var client = _app.CreateClient();

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/posts/gecmis")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/v1/posts/gelecek")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/v1/posts/taslak")).StatusCode);
    }

    [Theory]
    [InlineData("GET", "/api/v1/admin/dashboard")]
    [InlineData("GET", "/api/v1/admin/inquiries")]
    [InlineData("GET", "/api/v1/admin/services")]
    [InlineData("GET", "/api/v1/auth/me")]
    public async Task Admin_endpoints_require_authentication(string method, string url)
    {
        var client = _app.CreateClient();
        var res = await client.SendAsync(new HttpRequestMessage(new HttpMethod(method), url));
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Login_without_csrf_token_is_rejected()
    {
        await _app.EnsureAdminAsync();
        var client = _app.CreateClient();
        var res = await client.PostAsJsonAsync("/api/v1/auth/login", new { email = TestApp.AdminEmail, password = TestApp.AdminPassword });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Login_with_wrong_password_returns_401()
    {
        await _app.EnsureAdminAsync();
        var client = _app.CreateClient();
        await TestApp.SetCsrfAsync(client);
        var res = await client.PostAsJsonAsync("/api/v1/auth/login", new { email = TestApp.AdminEmail, password = "yanlis-parola-123" });
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Admin_can_create_service_and_slug_is_generated_and_unique()
    {
        var client = await _app.CreateAdminClientAsync();
        var body = new { title = "Özel Entegrasyon Çözümü", summary = "Özet", body = "", sortOrder = 0, isPublished = true };

        var first = await client.PostAsJsonAsync("/api/v1/admin/services", body);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        var created = await first.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("ozel-entegrasyon-cozumu", created.GetProperty("slug").GetString());

        var duplicate = await client.PostAsJsonAsync("/api/v1/admin/services", body);
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
    }

    [Fact]
    public async Task Admin_mutation_without_csrf_header_is_rejected()
    {
        var client = await _app.CreateAdminClientAsync();
        client.DefaultRequestHeaders.Remove("X-CSRF-TOKEN");
        var res = await client.PostAsJsonAsync("/api/v1/admin/technologies", new { name = "Go", category = "Backend", sortOrder = 0, isPublished = true });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Inquiry_validation_returns_field_errors()
    {
        var client = _app.CreateClient();
        var res = await client.PostAsJsonAsync("/api/v1/inquiries", new { name = "", email = "gecersiz", message = "kısa", consent = false });

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        var problem = await res.Content.ReadFromJsonAsync<JsonElement>();
        var errors = problem.GetProperty("errors");
        Assert.True(errors.TryGetProperty("name", out _));
        Assert.True(errors.TryGetProperty("email", out _));
        Assert.True(errors.TryGetProperty("message", out _));
        Assert.True(errors.TryGetProperty("consent", out _));
    }

    [Fact]
    public async Task Valid_inquiry_is_saved_and_honeypot_is_ignored()
    {
        var client = _app.CreateClient();
        var valid = await client.PostAsJsonAsync("/api/v1/inquiries", new
        {
            name = "Ayşe Yılmaz", email = "AYSE@ornek.com", company = "Örnek", message = "Stok takibi için bir sistem arıyoruz, görüşelim.", consent = true,
        });
        var bot = await client.PostAsJsonAsync("/api/v1/inquiries", new
        {
            name = "Bot", email = "bot@spam.com", message = "spam spam spam spam spam spam", consent = true, website = "http://spam",
        });

        Assert.Equal(HttpStatusCode.Accepted, valid.StatusCode);
        Assert.Equal(HttpStatusCode.Accepted, bot.StatusCode);

        using var scope = _app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.True(await db.Inquiries.AnyAsync(i => i.Email == "ayse@ornek.com" && i.Status == InquiryStatus.New));
        Assert.False(await db.Inquiries.AnyAsync(i => i.Email == "bot@spam.com"));
    }
}
