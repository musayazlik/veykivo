using FluentValidation;
using Veykivo.Application.Common;
using Veykivo.Application.Contracts;
using Veykivo.Application.Services.Ai;
using Veykivo.Domain.Enums;

namespace Veykivo.Application.Validation;

internal static class RuleExtensions
{
    public static IRuleBuilderOptions<T, string?> OptionalSlug<T>(this IRuleBuilder<T, string?> rule) =>
        rule.Must(s => string.IsNullOrWhiteSpace(s) || Slug.IsValid(s))
            .WithMessage("Slug yalnızca küçük harf, rakam ve tire içerebilir (ör. ozel-yazilim).")
            .MaximumLength(160);

    public static IRuleBuilderOptions<T, string?> OptionalUrl<T>(this IRuleBuilder<T, string?> rule) =>
        rule.Must(u => string.IsNullOrWhiteSpace(u) ||
                       (Uri.TryCreate(u, UriKind.Absolute, out var uri) && (uri.Scheme == "https" || uri.Scheme == "http")))
            .WithMessage("Geçerli bir bağlantı girin (https://...).");
}

public sealed class CreateInquiryValidator : AbstractValidator<CreateInquiryRequest>
{
    public CreateInquiryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Adınızı yazın.").MaximumLength(120);
        RuleFor(x => x.Email).NotEmpty().WithMessage("E-posta adresinizi yazın.")
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi yazın.").MaximumLength(200);
        RuleFor(x => x.Company).MaximumLength(160);
        RuleFor(x => x.Phone).MaximumLength(40)
            .Matches(@"^[0-9+()\s-]*$").WithMessage("Telefon numarası yalnızca rakam ve + ( ) - içerebilir.");
        RuleFor(x => x.ServiceInterest).MaximumLength(160);
        RuleFor(x => x.Message).NotEmpty().WithMessage("Projenizden kısaca bahsedin.")
            .MinimumLength(20).WithMessage("Mesajınız en az 20 karakter olmalı.")
            .MaximumLength(4000);
        RuleFor(x => x.Consent).Equal(true).WithMessage("Devam etmek için KVKK aydınlatma metnini onaylayın.");
    }
}

public sealed class LoginValidator : AbstractValidator<LoginRequest>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(x => x.Password).NotEmpty().MaximumLength(1024);
    }
}

public sealed class UpsertServiceValidator : AbstractValidator<UpsertServiceRequest>
{
    public UpsertServiceValidator()
    {
        RuleFor(x => x.Slug).OptionalSlug();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Summary).NotEmpty().MaximumLength(400);
        RuleFor(x => x.Body).NotNull().MaximumLength(20000);
        RuleFor(x => x.Icon).MaximumLength(60);
        RuleFor(x => x.SeoTitle).MaximumLength(70);
        RuleFor(x => x.SeoDescription).MaximumLength(170);
    }
}

public sealed class UpsertProjectValidator : AbstractValidator<UpsertProjectRequest>
{
    public UpsertProjectValidator()
    {
        RuleFor(x => x.Slug).OptionalSlug();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(160);
        RuleFor(x => x.ClientName).MaximumLength(160);
        RuleFor(x => x.Sector).MaximumLength(80);
        RuleFor(x => x.Summary).NotEmpty().MaximumLength(400);
        RuleFor(x => x.Challenge).NotNull().MaximumLength(8000);
        RuleFor(x => x.Solution).NotNull().MaximumLength(8000);
        RuleFor(x => x.Outcome).NotNull().MaximumLength(8000);
        RuleFor(x => x.SeoTitle).MaximumLength(70);
        RuleFor(x => x.SeoDescription).MaximumLength(170);
    }
}

public sealed class UpsertTechnologyValidator : AbstractValidator<UpsertTechnologyRequest>
{
    public UpsertTechnologyValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(80);
        RuleFor(x => x.Category).IsInEnum();
        RuleFor(x => x.Icon).MaximumLength(60);
    }
}

public sealed class UpsertTeamMemberValidator : AbstractValidator<UpsertTeamMemberRequest>
{
    public UpsertTeamMemberValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.RoleTitle).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Bio).NotNull().MaximumLength(1200);
        RuleFor(x => x.LinkedInUrl).OptionalUrl().MaximumLength(300);
    }
}

public sealed class UpsertPostValidator : AbstractValidator<UpsertPostRequest>
{
    public UpsertPostValidator()
    {
        RuleFor(x => x.Slug).OptionalSlug();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Excerpt).NotEmpty().MaximumLength(400);
        RuleFor(x => x.BodyMarkdown).NotNull().MaximumLength(100000);
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.SeoTitle).MaximumLength(70);
        RuleFor(x => x.SeoDescription).MaximumLength(170);
        RuleFor(x => x.TagIds).Must(t => t is null || t.Count <= 10).WithMessage("Bir yazıya en fazla 10 etiket eklenebilir.");
        // Yayına alınan (veya planlanan) yazının sitede gruplanabilmesi için kategori ve etiket zorunlu.
        When(x => x.Status == PostStatus.Published, () =>
        {
            RuleFor(x => x.CategoryId).NotNull().WithMessage("Yayınlamak için bir kategori seçin.");
            RuleFor(x => x.TagIds).Must(t => t is { Count: > 0 }).WithMessage("Yayınlamak için en az bir etiket ekleyin.");
        });
    }
}

public sealed class UpsertCategoryValidator : AbstractValidator<UpsertCategoryRequest>
{
    public UpsertCategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Kategori adı zorunlu.").MaximumLength(60);
        RuleFor(x => x.Slug).OptionalSlug();
        RuleFor(x => x.Description).MaximumLength(200);
        RuleFor(x => x.Color).NotEmpty().Matches("^#[0-9a-fA-F]{6}$").WithMessage("Renk #RRGGBB biçiminde olmalı.");
    }
}

public sealed class UpsertTagValidator : AbstractValidator<UpsertTagRequest>
{
    public UpsertTagValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Etiket adı zorunlu.").MaximumLength(40);
        RuleFor(x => x.Slug).OptionalSlug();
    }
}

public sealed class CreateCommentValidator : AbstractValidator<CreateCommentRequest>
{
    public CreateCommentValidator()
    {
        RuleFor(x => x.AuthorName).NotEmpty().WithMessage("Adınızı yazın.")
            .MinimumLength(2).WithMessage("Adınız en az 2 karakter olmalı.").MaximumLength(60);
        RuleFor(x => x.AuthorEmail).EmailAddress().WithMessage("Geçerli bir e-posta adresi yazın.").MaximumLength(200)
            .When(x => !string.IsNullOrWhiteSpace(x.AuthorEmail));
        RuleFor(x => x.Body).NotEmpty().WithMessage("Yorumunuzu yazın.")
            .MinimumLength(2).MaximumLength(2000).WithMessage("Yorum en fazla 2000 karakter olabilir.");
    }
}

public sealed class UpdateCommentStatusValidator : AbstractValidator<UpdateCommentStatusRequest>
{
    public UpdateCommentStatusValidator() => RuleFor(x => x.Status).IsInEnum();
}

public sealed class ReplyCommentValidator : AbstractValidator<ReplyCommentRequest>
{
    public ReplyCommentValidator() => RuleFor(x => x.Body).NotEmpty().WithMessage("Yanıt boş olamaz.").MaximumLength(2000);
}

public sealed class AiGeneratePostValidator : AbstractValidator<AiGeneratePostRequest>
{
    public AiGeneratePostValidator()
    {
        RuleFor(x => x.Topic).NotEmpty().WithMessage("Konu veya kısa bir brif yazın.")
            .MinimumLength(3).MaximumLength(2000);
        RuleFor(x => x.Fields).NotNull();
        RuleFor(x => x.Fields).Must(f => f.Title || f.Excerpt || f.Content || f.Seo || f.Category || f.Tags || f.Cover)
            .WithMessage("Üretilecek en az bir alan seçin.").When(x => x.Fields is not null);
        RuleFor(x => x.Style).Must(v => v is null || AiOptions.Styles.Contains(v)).WithMessage("Geçersiz yazım stili.");
        RuleFor(x => x.Depth).Must(v => v is null || AiOptions.Depths.Contains(v)).WithMessage("Geçersiz uzunluk.");
        RuleFor(x => x.Language).Must(v => v is null || AiOptions.Languages.Contains(v)).WithMessage("Geçersiz dil.");
        RuleFor(x => x.Model).MaximumLength(120);
        RuleFor(x => x.ImageModel).MaximumLength(120);
    }
}

public sealed class AiRewriteValidator : AbstractValidator<AiRewriteRequest>
{
    public AiRewriteValidator()
    {
        RuleFor(x => x.Instruction).NotEmpty().WithMessage("Ne yapılmasını istediğinizi yazın.").MaximumLength(500);
        RuleFor(x => x).Must(x => !string.IsNullOrWhiteSpace(x.Title) || !string.IsNullOrWhiteSpace(x.Excerpt) || !string.IsNullOrWhiteSpace(x.Content))
            .WithMessage("Yeniden yazılacak bir alan gönderin.");
        RuleFor(x => x.Content).MaximumLength(60000);
        RuleFor(x => x.Language).Must(v => v is null || AiOptions.Languages.Contains(v)).WithMessage("Geçersiz dil.");
    }
}

public sealed class UpdateInquiryStatusValidator : AbstractValidator<UpdateInquiryStatusRequest>
{
    public UpdateInquiryStatusValidator() => RuleFor(x => x.Status).IsInEnum();
}

public sealed class UpdateMediaValidator : AbstractValidator<UpdateMediaRequest>
{
    public UpdateMediaValidator() => RuleFor(x => x.AltText).NotNull().MaximumLength(MediaRules.MaxAltTextLength);
}
