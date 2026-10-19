using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Veykivo.Application.Abstractions;
using Veykivo.Infrastructure.Persistence;

namespace Veykivo.Infrastructure.Storage;

public sealed class FileDeletionWorker(IServiceScopeFactory scopes, ILogger<FileDeletionWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(15));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try { await ProcessBatchAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogError(ex, "Dosya silme kuyruğu işlenemedi; yeniden denenecek."); }
        }
    }

    public async Task ProcessBatchAsync(CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var storage = scope.ServiceProvider.GetRequiredService<IFileStorage>();
        var jobs = await db.PendingFileDeletions.OrderBy(j => j.CreatedAt).Take(50).ToListAsync(ct);
        foreach (var job in jobs)
        {
            try
            {
                await storage.DeleteAsync(job.StorageKey, ct);
                db.PendingFileDeletions.Remove(job);
                await db.SaveChangesAsync(ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                db.Entry(job).State = EntityState.Unchanged;
                logger.LogWarning(ex, "Dosya silinemedi; iş kuyrukta tutuluyor: {JobId}", job.Id);
            }
        }
    }
}
