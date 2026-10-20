using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Veykivo.Api.Infrastructure;
using Veykivo.Application.Contracts;
using Veykivo.Infrastructure.Identity;

namespace Veykivo.Tests;

public sealed class SecurityTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Revoked_admin_session_cannot_read_or_write(bool removeRole)
    {
        using var app = new TestApp();
        using var client = await app.CreateAdminClientAsync();
        using (var scope = app.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
            var user = (await users.FindByEmailAsync(TestApp.AdminEmail))!;
            if (removeRole) Assert.True((await users.RemoveFromRoleAsync(user, Roles.Admin)).Succeeded);
            else
            {
                user.IsActive = false;
                Assert.True((await users.UpdateAsync(user)).Succeeded);
            }
        }

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/admin/dashboard")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/v1/admin/technologies",
            new { name = "Rejected", category = "Backend", sortOrder = 0, isPublished = true })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/auth/me")).StatusCode);
    }

    [Fact]
    public async Task Demo_account_can_read_panel_but_cannot_write()
    {
        using var app = new TestApp();
        using var client = await app.CreateDemoClientAsync();

        var me = await client.GetFromJsonAsync<CurrentUserDto>("/api/v1/auth/me");
        Assert.Equal([Roles.Demo], me!.Roles);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/admin/dashboard")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/admin/inquiries")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/admin/site-settings")).StatusCode);

        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/api/v1/admin/technologies",
            new { name = "Rejected", category = "Backend", sortOrder = 0, isPublished = true })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PutAsJsonAsync("/api/v1/admin/site-settings",
            new Dictionary<string, string> { ["company.name"] = "Değişti" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.DeleteAsync($"/api/v1/admin/posts/{Guid.NewGuid()}")).StatusCode);

        // Çıkış panel grubunun dışında; demo hesabı da oturumunu kapatabilmeli.
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsync("/api/v1/auth/logout", null)).StatusCode);
    }

    [Fact]
    public async Task Demoted_admin_cannot_write_with_existing_session()
    {
        using var app = new TestApp();
        using var client = await app.CreateAdminClientAsync();
        using (var scope = app.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
            var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
            await roles.CreateAsync(new IdentityRole<Guid>(Roles.Demo));
            var user = (await users.FindByEmailAsync(TestApp.AdminEmail))!;
            Assert.True((await users.AddToRoleAsync(user, Roles.Demo)).Succeeded);
            Assert.True((await users.RemoveFromRoleAsync(user, Roles.Admin)).Succeeded);
        }

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/admin/dashboard")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/api/v1/admin/technologies",
            new { name = "Rejected", category = "Backend", sortOrder = 0, isPublished = true })).StatusCode);
    }

    [Fact]
    public async Task Changing_untrusted_forwarded_ip_does_not_reset_rate_limit()
    {
        using var app = new TestApp();
        using var client = app.CreateClient();
        for (var i = 1; i <= 5; i++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/inquiries")
            {
                Content = JsonContent.Create(new { }),
            };
            request.Headers.Add("X-Forwarded-For", $"198.51.100.{i}");
            Assert.Equal(HttpStatusCode.BadRequest, (await client.SendAsync(request)).StatusCode);
        }
        using var limited = new HttpRequestMessage(HttpMethod.Post, "/api/v1/inquiries") { Content = JsonContent.Create(new { }) };
        limited.Headers.Add("X-Forwarded-For", "198.51.100.200");
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.SendAsync(limited)).StatusCode);
    }

    [Fact]
    public void Empty_proxy_allowlist_disables_forwarding_even_with_legacy_trust_all_setting()
    {
        var options = new ForwardedHeadersOptions();
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ForwardedHeaders:TrustAllProxies"] = "true",
        }).Build();
        TrustedProxyConfiguration.Configure(options, config);
        Assert.Equal(ForwardedHeaders.None, options.ForwardedHeaders);
    }

    [Fact]
    public void Explicit_proxy_allowlist_does_not_trust_other_addresses()
    {
        var options = new ForwardedHeadersOptions();
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ForwardedHeaders:KnownProxies:0"] = "192.0.2.10",
        }).Build();
        TrustedProxyConfiguration.Configure(options, config);
        Assert.Single(options.KnownProxies);
        Assert.Equal(IPAddress.Parse("192.0.2.10"), options.KnownProxies[0]);
        Assert.Empty(options.KnownIPNetworks);
        Assert.Equal(1, options.ForwardLimit);
    }
}
