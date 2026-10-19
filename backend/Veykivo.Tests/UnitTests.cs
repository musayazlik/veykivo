using Veykivo.Application.Common;
using Veykivo.Application.Services;
using Veykivo.Domain.Entities;

namespace Veykivo.Tests;

public sealed class UnitTests
{
    [Theory]
    [InlineData("Özel Yazılım Geliştirme", "ozel-yazilim-gelistirme")]
    [InlineData("  ERP ve CRM Çözümleri  ", "erp-ve-crm-cozumleri")]
    [InlineData("Yapay Zekâ & Otomasyon!", "yapay-zeka-otomasyon")]
    [InlineData("İŞ SÜREÇLERİ", "is-surecleri")]
    public void Slug_from_turkish_title(string input, string expected) => Assert.Equal(expected, Slug.From(input));

    [Theory]
    [InlineData("gecerli-slug", true)]
    [InlineData("Buyuk-Harf", false)]
    [InlineData("cift--tire", false)]
    [InlineData("-bas-tire", false)]
    public void Slug_validation(string slug, bool valid) => Assert.Equal(valid, Slug.IsValid(slug));

    [Fact]
    public void Image_signature_check_rejects_mismatched_content()
    {
        byte[] jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0, 0, 0, 0, 0, 0, 0, 0];
        byte[] png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0];
        byte[] text = "<svg onload=alert(1)>"u8.ToArray();

        Assert.True(MediaService.HasValidSignature(jpeg, "image/jpeg"));
        Assert.True(MediaService.HasValidSignature(png, "image/png"));
        Assert.False(MediaService.HasValidSignature(png, "image/jpeg"));
        Assert.False(MediaService.HasValidSignature(text, "image/png"));
    }

    [Fact]
    public void Project_publish_date_is_set_once()
    {
        var project = new Project { Slug = "p", Title = "P", Summary = "S" };
        project.SetPublished(true, DateTimeOffset.UtcNow);
        var first = project.PublishedAt;

        project.SetPublished(false, DateTimeOffset.UtcNow);
        project.SetPublished(true, DateTimeOffset.UtcNow);

        Assert.NotNull(first);
        Assert.Equal(first, project.PublishedAt);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(200, 1)]
    [InlineData(201, 2)]
    [InlineData(1000, 5)]
    public void Reading_time_estimate(int words, int minutes) =>
        Assert.Equal(minutes, Post.EstimateReadingMinutes(string.Join(' ', Enumerable.Repeat("kelime", words))));
}
