using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Veykivo.Application.Services;

namespace Veykivo.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<PublicContentService>();
        services.AddScoped<DashboardService>();
        services.AddScoped<ServicesAdminService>();
        services.AddScoped<ProjectsAdminService>();
        services.AddScoped<TechnologiesAdminService>();
        services.AddScoped<TeamAdminService>();
        services.AddScoped<PostsAdminService>();
        services.AddScoped<BlogTaxonomyService>();
        services.AddScoped<CommentService>();
        services.AddScoped<Services.Ai.AiBlogService>();
        services.AddScoped<InquiryService>();
        services.AddScoped<MediaService>();
        services.AddScoped<SiteSettingsService>();
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly, includeInternalTypes: true);
        return services;
    }
}
