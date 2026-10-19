using Microsoft.Extensions.Options;
using Veykivo.Application.Abstractions;

namespace Veykivo.Infrastructure.Storage;

public sealed class StorageOptions
{
    /// <summary>Dosyaların yazılacağı kök klasör. Docker'da kalıcı volume'e bağlanmalı.</summary>
    public string RootPath { get; set; } = "wwwroot/uploads";

    /// <summary>Herkese açık URL öneki; frontend /uploads isteklerini API'ye yönlendirir.</summary>
    public string PublicBasePath { get; set; } = "/uploads";
}

/// <summary>
/// MVP için yerel disk adaptörü. S3 uyumlu depolama seçildiğinde aynı IFileStorage arayüzüyle değiştirilir.
/// Dosya adları her zaman rastgele üretilir; kullanıcı dosya adı diske yazılmaz.
/// </summary>
public sealed class LocalFileStorage(IOptions<StorageOptions> options) : IFileStorage
{
    private readonly StorageOptions _options = options.Value;

    public async Task<StoredFile> SaveAsync(Stream content, string extension, string mimeType, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var key = $"{now:yyyy}/{now:MM}/{Guid.NewGuid():N}{extension}";
        var fullPath = ResolvePath(key);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        var temporaryPath = fullPath + ".part";
        try
        {
            await using (var file = new FileStream(temporaryPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                await content.CopyToAsync(file, ct);
            File.Move(temporaryPath, fullPath);
        }
        catch
        {
            if (File.Exists(temporaryPath)) File.Delete(temporaryPath);
            throw;
        }

        return new StoredFile(key, $"{_options.PublicBasePath.TrimEnd('/')}/{key}");
    }

    public Task DeleteAsync(string storageKey, CancellationToken ct)
    {
        if (storageKey.StartsWith("static:", StringComparison.Ordinal)) return Task.CompletedTask;
        var fullPath = ResolvePath(storageKey);
        if (File.Exists(fullPath)) File.Delete(fullPath);
        return Task.CompletedTask;
    }

    private string ResolvePath(string key)
    {
        var root = Path.GetFullPath(_options.RootPath);
        var full = Path.GetFullPath(Path.Combine(root, key));
        var relative = Path.GetRelativePath(root, full);
        if (Path.IsPathRooted(key) || relative == "." || relative == ".." ||
            relative.StartsWith(".." + Path.DirectorySeparatorChar, StringComparison.Ordinal) || Path.IsPathRooted(relative))
            throw new InvalidOperationException("Geçersiz depolama anahtarı.");
        return full;
    }
}
