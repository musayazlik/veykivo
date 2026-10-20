using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Veykivo.Application.Services.Ai;
using Veykivo.Domain.Entities;
using Veykivo.Domain.Enums;
using Veykivo.Infrastructure.Persistence;

namespace Veykivo.Tests;

public sealed class BlogTests : IClassFixture<TestApp>
{
    private readonly TestApp _app;

    public BlogTests(TestApp app) => _app = app;

    private async Task<Post> SeedPublishedPostAsync(string slug)
    {
        var post = new Post { Slug = slug, Title = "Yazı", Excerpt = "Özet", Status = PostStatus.Published, PublishedAt = DateTimeOffset.UtcNow.AddDays(-1) };
        await _app.SeedAsync(db => { db.Posts.Add(post); return Task.CompletedTask; });
        return post;
    }

    [Fact]
    public async Task Publishing_requires_category_and_tag_but_draft_does_not()
    {
        var client = await _app.CreateAdminClientAsync();
        var draft = new { title = "Taslak yazı", excerpt = "Özet", bodyMarkdown = "", status = "Draft", isFeatured = false };
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/v1/admin/posts", draft)).StatusCode);

        var publish = new { title = "Yayın yazısı", excerpt = "Özet", bodyMarkdown = "", status = "Published", isFeatured = false };
        var res = await client.PostAsJsonAsync("/api/v1/admin/posts", publish);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        var errors = (await res.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.True(errors.TryGetProperty("categoryId", out _));
        Assert.True(errors.TryGetProperty("tagIds", out _));

        var category = await (await client.PostAsJsonAsync("/api/v1/admin/categories", new { name = "Test Kategori", color = "#2F6F6A" }))
            .Content.ReadFromJsonAsync<JsonElement>();
        var tag = await (await client.PostAsJsonAsync("/api/v1/admin/tags", new { name = "test etiketi" }))
            .Content.ReadFromJsonAsync<JsonElement>();
        var ok = await client.PostAsJsonAsync("/api/v1/admin/posts", new
        {
            title = "Yayın yazısı", excerpt = "Özet", bodyMarkdown = "", status = "Published", isFeatured = true,
            categoryId = category.GetProperty("id").GetGuid(), tagIds = new[] { tag.GetProperty("id").GetGuid() },
        });
        Assert.Equal(HttpStatusCode.Created, ok.StatusCode);

        var publicPost = await _app.CreateClient().GetFromJsonAsync<JsonElement>("/api/v1/posts/yayin-yazisi");
        Assert.Equal("test-kategori", publicPost.GetProperty("category").GetProperty("slug").GetString());
        Assert.Equal("test-etiketi", publicPost.GetProperty("tags")[0].GetProperty("slug").GetString());
    }

    [Fact]
    public async Task Creating_existing_tag_name_returns_the_existing_tag()
    {
        var client = await _app.CreateAdminClientAsync();
        var first = await (await client.PostAsJsonAsync("/api/v1/admin/tags", new { name = "Yinelenen" })).Content.ReadFromJsonAsync<JsonElement>();
        var second = await (await client.PostAsJsonAsync("/api/v1/admin/tags", new { name = "yinelenen" })).Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(first.GetProperty("id").GetGuid(), second.GetProperty("id").GetGuid());
    }

    [Fact]
    public async Task Comments_are_hidden_until_approved_and_honeypot_is_dropped()
    {
        var post = await SeedPublishedPostAsync("yorum-testi");
        var visitor = _app.CreateClient();

        var created = await visitor.PostAsJsonAsync("/api/v1/posts/yorum-testi/comments", new { authorName = "Ayşe", body = "Faydalı bir yazı olmuş." });
        Assert.Equal(HttpStatusCode.Accepted, created.StatusCode);
        // Honeypot doluysa diğer alanlar geçersiz olsa bile doğrulama hatası dönmez; bot sessizce kabul edilir.
        var bot = await visitor.PostAsJsonAsync("/api/v1/posts/yorum-testi/comments", new { authorName = "Bot", body = "", website = "http://spam" });
        Assert.Equal(HttpStatusCode.Accepted, bot.StatusCode);

        var before = await visitor.GetFromJsonAsync<JsonElement>("/api/v1/posts/yorum-testi");
        Assert.Equal(0, before.GetProperty("commentCount").GetInt32());

        Guid commentId;
        using (var scope = _app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.False(await db.Comments.AnyAsync(c => c.AuthorName == "Bot"));
            commentId = (await db.Comments.SingleAsync(c => c.PostId == post.Id)).Id;
        }

        var admin = await _app.CreateAdminClientAsync();
        Assert.Equal(HttpStatusCode.NoContent,
            (await admin.PatchAsJsonAsync($"/api/v1/admin/comments/{commentId}", new { status = "Approved" })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent,
            (await admin.PostAsJsonAsync($"/api/v1/admin/comments/{commentId}/reply", new { body = "Teşekkürler!" })).StatusCode);

        var after = await visitor.GetFromJsonAsync<JsonElement>("/api/v1/posts/yorum-testi");
        Assert.Equal(2, after.GetProperty("commentCount").GetInt32());
        var reply = after.GetProperty("comments")[0].GetProperty("replies")[0];
        Assert.True(reply.GetProperty("isStaffReply").GetBoolean());
    }

    [Fact]
    public async Task Comment_on_unknown_post_returns_404()
    {
        var res = await _app.CreateClient().PostAsJsonAsync("/api/v1/posts/olmayan-yazi/comments", new { authorName = "Ali", body = "Merhaba" });
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task Ai_generate_parses_json_retries_structure_and_links_citations()
    {
        var admin = await _app.CreateAdminClientAsync();
        _app.FakeAi.Responses.Clear();
        // 1) Araştırma: iki kaynak döner.
        _app.FakeAi.Responses.Enqueue(new AiChatResult("ERP projeleri sıklıkla gecikir [1]. Veri temizliği kritiktir [2].",
            [new AiCitation("Kaynak A", "https://a.example"), new AiCitation("Kaynak B", "https://b.example")], "perplexity/sonar-pro"));
        // 2) Yazım: yeterli alt başlık yok → tekrar istenir.
        _app.FakeAi.Responses.Enqueue(new AiChatResult("""{"title":"ERP","content":"Giriş\n## Bir\nMetin [1]"}""", [], "openai/gpt-5-mini"));
        // 3) Tekrar: yapı tamam, kod bloğu içinde dönse de ayrıştırılmalı.
        _app.FakeAi.Responses.Enqueue(new AiChatResult("""
            ```json
            {"title":"ERP projesine hazırlık","excerpt":"Kısa özet [2]","content":"# Başlık\nGiriş [1]\n## A\nx\n## B\ny [2]\n## C\nz\n## D\nw\n## E\nv","category":"ERP","tags":["ERP","Süreç"]}
            ```
            """, [], "openai/gpt-5-mini"));

        var res = await admin.PostAsJsonAsync("/api/v1/admin/ai/generate-post", new
        {
            topic = "ERP projesine başlamadan önce",
            fields = new { title = true, excerpt = true, content = true, seo = false, category = true, tags = true, cover = false },
            webSearch = true, depth = "standard", language = "tr",
        });
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal("ERP projesine hazırlık", body.GetProperty("title").GetString());
        Assert.Equal("Kısa özet", body.GetProperty("excerpt").GetString());
        var content = body.GetProperty("content").GetString()!;
        Assert.StartsWith("## Başlık", content);
        Assert.Contains("[[1]](https://a.example)", content);
        Assert.Contains("## Kaynakça", content);
        Assert.Equal(["erp", "süreç"], body.GetProperty("tags").EnumerateArray().Select(t => t.GetString()!).ToArray());
        Assert.Equal(2, body.GetProperty("sources").GetArrayLength());
        Assert.StartsWith("perplexity/", _app.FakeAi.Requests[0].Model);
    }

    [Fact]
    public async Task Ai_returns_503_when_not_configured()
    {
        var admin = await _app.CreateAdminClientAsync();
        _app.FakeAi.IsConfigured = false;
        try
        {
            var res = await admin.PostAsJsonAsync("/api/v1/admin/ai/rewrite", new { instruction = "Kısalt", content = "Uzun metin" });
            Assert.Equal(HttpStatusCode.ServiceUnavailable, res.StatusCode);
        }
        finally
        {
            _app.FakeAi.IsConfigured = true;
        }
    }

    [Theory]
    [InlineData("Önce açıklama {\"a\":\"b\"} sonra metin", "b")]
    [InlineData("```json\n{\"a\":\"b\"}\n```", "b")]
    public void Ai_json_is_extracted_from_noisy_output(string text, string expected) =>
        Assert.Equal(expected, AiBlogService.ParseJson(text).GetProperty("a").GetString());

    [Fact]
    public void Unknown_citation_numbers_are_removed() =>
        Assert.Equal("Bilgi [[1]](https://a) ve uydurma .",
            AiBlogService.LinkCitations("Bilgi [1] ve uydurma [7].", [new AiCitation("A", "https://a")]));
}
