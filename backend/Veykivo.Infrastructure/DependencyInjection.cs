using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Services.Ai;
using Veykivo.Infrastructure.Ai;
using Veykivo.Infrastructure.Email;
using Veykivo.Infrastructure.Persistence;
using Veykivo.Infrastructure.Storage;

namespace Veykivo.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var connectionString = config.GetConnectionString("Default")
                               ?? throw new InvalidOperationException("ConnectionStrings:Default tanımlı değil.");

        services.AddDbContext<AppDbContext>(o => o.UseNpgsql(connectionString));
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        services.Configure<StorageOptions>(config.GetSection("Storage"));
        services.AddSingleton<IFileStorage, LocalFileStorage>();
        services.AddHostedService<FileDeletionWorker>();

        services.Configure<SmtpOptions>(config.GetSection("Smtp"));
        services.AddScoped<IEmailSender, SmtpEmailSender>();

        services.Configure<OpenRouterOptions>(config.GetSection("OpenRouter"));
        // Zaman aşımı her çağrıda ayrı yönetilir (araştırma adımı daha uzun sürebilir).
        services.AddHttpClient<IAiClient, OpenRouterClient>(c => c.Timeout = Timeout.InfiniteTimeSpan);

        services.AddScoped<DbSeeder>();
        return services;
    }
}
