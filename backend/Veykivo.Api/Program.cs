using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Serilog;
using Veykivo.Api.Endpoints;
using Veykivo.Api.Infrastructure;
using Veykivo.Application;
using Veykivo.Application.Services;
using Veykivo.Infrastructure;
using Veykivo.Infrastructure.Identity;
using Veykivo.Infrastructure.Persistence;
using Veykivo.Infrastructure.Storage;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = MediaService.MaxBytes + 64 * 1024);

builder.Host.UseSerilog((ctx, lc) => lc.ReadFrom.Configuration(ctx.Configuration).Enrich.FromLogContext().WriteTo.Console());

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
    // Sayılar OpenAPI sözleşmesinde "number | string" yerine net "number" olarak görünsün.
    o.SerializerOptions.NumberHandling = JsonNumberHandling.Strict;
    o.SerializerOptions.RespectNullableAnnotations = true;
});
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ProblemExceptionHandler>();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>("database");

// Oturum ve CSRF cookie'leri container yeniden başlasa da geçerli kalsın.
if (builder.Configuration["DataProtection:KeysPath"] is { Length: > 0 } keysPath)
    builder.Services.AddDataProtection().SetApplicationName("veykivo").PersistKeysToFileSystem(new DirectoryInfo(keysPath));

// --- Kimlik doğrulama: ASP.NET Core Identity + HttpOnly cookie (Next.js aynı origin altında /api'yi proxy'ler)
builder.Services.AddAuthentication(IdentityConstants.ApplicationScheme).AddIdentityCookies();
builder.Services.AddIdentityCore<AppUser>(o =>
    {
        o.User.RequireUniqueEmail = true;
        o.Password.RequiredLength = 10;
        o.Password.RequireNonAlphanumeric = false;
        o.Lockout.MaxFailedAccessAttempts = 5;
        o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddSignInManager();

var secureCookies = builder.Configuration.GetValue("Security:SecureCookies", !builder.Environment.IsDevelopment());
builder.Services.ConfigureApplicationCookie(o =>
{
    o.Cookie.Name = "veykivo.auth";
    o.Cookie.HttpOnly = true;
    o.Cookie.SameSite = SameSiteMode.Strict;
    o.Cookie.SecurePolicy = secureCookies ? CookieSecurePolicy.Always : CookieSecurePolicy.SameAsRequest;
    o.ExpireTimeSpan = TimeSpan.FromHours(8);
    o.SlidingExpiration = true;
    o.Events.OnValidatePrincipal = SessionValidation.ValidateAsync;
    // API olduğu için login sayfasına yönlendirme yerine durum kodu döner.
    o.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = StatusCodes.Status401Unauthorized; return Task.CompletedTask; };
    o.Events.OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = StatusCodes.Status403Forbidden; return Task.CompletedTask; };
});

builder.Services.AddAuthorizationBuilder()
    .AddPolicy(AuthPolicies.Panel, p => p.RequireAuthenticatedUser().RequireRole(Roles.Admin, Roles.Demo));

builder.Services.AddAntiforgery(o =>
{
    o.HeaderName = "X-CSRF-TOKEN";
    o.Cookie.Name = "veykivo.csrf";
    o.Cookie.SameSite = SameSiteMode.Strict;
    o.Cookie.SecurePolicy = secureCookies ? CookieSecurePolicy.Always : CookieSecurePolicy.SameAsRequest;
});

// --- Rate limiting (IP bazlı)
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy(RateLimitPolicies.Inquiry, http => RateLimitPartition.GetFixedWindowLimiter(
        http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(10) }));
    o.AddPolicy(RateLimitPolicies.Login, http => RateLimitPartition.GetFixedWindowLimiter(
        http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(5) }));
    o.AddPolicy(RateLimitPolicies.Comment, http => RateLimitPartition.GetFixedWindowLimiter(
        http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(10) }));
    // Ücretli sağlayıcı çağrıları: kullanıcı başına makul bir üst sınır.
    o.AddPolicy(RateLimitPolicies.Ai, http => RateLimitPartition.GetFixedWindowLimiter(
        http.User.Identity?.Name ?? http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 30, Window = TimeSpan.FromMinutes(10) }));
    // /health her çağrıda veritabanına vurur; dışarıdan sonsuz istekle meşgul edilemesin.
    o.AddPolicy(RateLimitPolicies.Health, http => RateLimitPartition.GetFixedWindowLimiter(
        http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 60, Window = TimeSpan.FromMinutes(1) }));
});

// API yalnızca Next.js / ters proxy arkasında yayınlanır; gerçek istemci IP'si X-Forwarded-For'dan okunur.
builder.Services.Configure<ForwardedHeadersOptions>(o => TrustedProxyConfiguration.Configure(o, builder.Configuration));

var app = builder.Build();

// Proxy güven listesi boşsa gerçek istemci IP'si okunamaz ve IP bazlı rate limit'ler
// ters proxy arkasında tüm kullanıcılar için tek kovada toplanır; yanlış yapılandırmayı görünür kıl.
if (!app.Environment.IsDevelopment())
{
    var proxies = app.Configuration.GetSection("ForwardedHeaders:KnownProxies").Get<string[]>() ?? [];
    var networks = app.Configuration.GetSection("ForwardedHeaders:KnownNetworks").Get<string[]>() ?? [];
    if (proxies.Length + networks.Length == 0)
        app.Logger.LogWarning("ForwardedHeaders:KnownProxies/KnownNetworks boş; ters proxy arkasında IP bazlı rate limit'ler tek kovada toplanır.");
}

if (!app.Environment.IsDevelopment()) app.UseHsts();

app.UseForwardedHeaders();
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseSerilogRequestLogging();

app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.XContentTypeOptions = "nosniff";
    ctx.Response.Headers.XFrameOptions = "DENY";
    ctx.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    await next();
});

// Yüklenen görseller
var storage = app.Configuration.GetSection("Storage").Get<StorageOptions>() ?? new StorageOptions();
var uploadsRoot = Path.GetFullPath(storage.RootPath);
Directory.CreateDirectory(uploadsRoot);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsRoot),
    RequestPath = storage.PublicBasePath,
    OnPrepareResponse = ctx => ctx.Context.Response.Headers.CacheControl = "public,max-age=31536000,immutable",
});

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(o =>
    {
        o.SwaggerEndpoint("/openapi/v1.json", "Veykivo API v1");
        o.RoutePrefix = "swagger";
    });
}

app.MapHealthChecks("/health").RequireRateLimiting(RateLimitPolicies.Health);
app.MapPublicEndpoints();
app.MapAuthEndpoints();
app.MapAdminEndpoints();

if (app.Configuration.GetValue("Database:MigrateOnStartup", false))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (db.Database.IsRelational()) await db.Database.MigrateAsync();
    await scope.ServiceProvider.GetRequiredService<DbSeeder>().SeedAsync();
}

app.Run();

public partial class Program;
