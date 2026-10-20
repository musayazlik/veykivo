using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Veykivo.Application.Services.Ai;
using Veykivo.Infrastructure.Identity;
using Veykivo.Infrastructure.Persistence;

namespace Veykivo.Tests;

/// <summary>API'yi bellek içi veritabanıyla ayağa kaldırır; her test sınıfı kendi veritabanını kullanır.</summary>
public sealed class TestApp : WebApplicationFactory<Program>
{
    public const string AdminEmail = "admin@test.local";
    public const string AdminPassword = "Test.Password123";

    public FakeAiClient FakeAi { get; } = new();

    private readonly string _dbName = $"veykivo-tests-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Default", "Host=unused");
        builder.UseSetting("Database:MigrateOnStartup", "false");
        builder.UseSetting("Security:SecureCookies", "false");
        builder.UseSetting("Storage:RootPath", Path.Combine(Path.GetTempPath(), _dbName));

        builder.ConfigureServices(services =>
        {
            // Npgsql kaydını bellek içi sağlayıcıyla değiştir.
            var toRemove = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                d.ServiceType == typeof(DbContextOptions) ||
                (d.ServiceType.IsGenericType && d.ServiceType.GetGenericTypeDefinition() == typeof(IDbContextOptionsConfiguration<>))).ToList();
            foreach (var d in toRemove) services.Remove(d);

            services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(_dbName));

            // Gerçek OpenRouter çağrısı yapılmaz; testler sahte istemcinin yanıtlarını kullanır.
            services.RemoveAll<IAiClient>();
            services.AddSingleton<IAiClient>(FakeAi);
        });
    }

    public async Task SeedAsync(Func<AppDbContext, Task> seed)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await seed(db);
        await db.SaveChangesAsync();
    }

    public const string DemoEmail = "demo@test.local";

    public Task EnsureAdminAsync() => EnsureUserAsync(AdminEmail, Roles.Admin);

    private async Task EnsureUserAsync(string email, string role)
    {
        using var scope = Services.CreateScope();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        if (!await roles.RoleExistsAsync(role)) await roles.CreateAsync(new IdentityRole<Guid>(role));
        if (await users.FindByEmailAsync(email) is not null) return;
        var user = new AppUser { UserName = email, Email = email, EmailConfirmed = true };
        var result = await users.CreateAsync(user, AdminPassword);
        Assert.True(result.Succeeded, string.Join(", ", result.Errors.Select(e => e.Description)));
        await users.AddToRoleAsync(user, role);
    }

    /// <summary>CSRF token'ı alıp giriş yapar ve oturum sonrası yenilenmiş token'ı istemciye ekler.</summary>
    public async Task<HttpClient> CreateAdminClientAsync()
    {
        await EnsureAdminAsync();
        return await LoginAsync(AdminEmail);
    }

    /// <summary>Salt okunur Demo rolündeki hesapla oturum açmış istemci.</summary>
    public async Task<HttpClient> CreateDemoClientAsync()
    {
        await EnsureUserAsync(DemoEmail, Roles.Demo);
        return await LoginAsync(DemoEmail);
    }

    private async Task<HttpClient> LoginAsync(string email)
    {
        var client = CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });

        await SetCsrfAsync(client);
        var login = await client.PostAsJsonAsync("/api/v1/auth/login", new { email, password = AdminPassword });
        login.EnsureSuccessStatusCode();
        await SetCsrfAsync(client);
        return client;
    }

    public static async Task SetCsrfAsync(HttpClient client)
    {
        var json = await client.GetFromJsonAsync<JsonElement>("/api/v1/auth/csrf");
        client.DefaultRequestHeaders.Remove("X-CSRF-TOKEN");
        client.DefaultRequestHeaders.Add("X-CSRF-TOKEN", json.GetProperty("token").GetString());
    }
}
