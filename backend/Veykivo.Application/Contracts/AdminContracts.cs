using Veykivo.Domain.Enums;

namespace Veykivo.Application.Contracts;

public sealed record LoginRequest(string Email, string Password);

public sealed record CurrentUserDto(Guid Id, string Email, string? DisplayName, IReadOnlyList<string> Roles);

public sealed record CsrfTokenDto(string Token);

public sealed record DashboardSummaryDto(
    int Services, int Projects, int Posts, int TeamMembers, int Technologies,
    int NewInquiries, int TotalInquiries, int PendingComments, IReadOnlyList<InquiryListItemDto> RecentInquiries);

public sealed record MediaAssetDto(Guid Id, string Url, string AltText, string MimeType, long SizeBytes, DateTimeOffset CreatedAt);

public sealed record UpdateMediaRequest(string AltText);

// --- Hizmetler
public sealed record AdminServiceDto(
    Guid Id, string Slug, string Title, string Summary, string Body, string? Icon, Guid? CoverImageId, MediaDto? CoverImage,
    int SortOrder, bool IsPublished, string? SeoTitle, string? SeoDescription, DateTimeOffset UpdatedAt, Guid Version);

public sealed record UpsertServiceRequest(
    string? Slug, string Title, string Summary, string Body, string? Icon, Guid? CoverImageId,
    int SortOrder, bool IsPublished, string? SeoTitle, string? SeoDescription, Guid? Version);

// --- Projeler
public sealed record AdminProjectDto(
    Guid Id, string Slug, string Title, string? ClientName, string? Sector, string Summary,
    string Challenge, string Solution, string Outcome, Guid? CoverImageId, MediaDto? CoverImage,
    bool IsPublished, bool IsFeatured, int SortOrder, DateTimeOffset? PublishedAt,
    IReadOnlyList<Guid> TechnologyIds, string? SeoTitle, string? SeoDescription, DateTimeOffset UpdatedAt, Guid Version);

public sealed record UpsertProjectRequest(
    string? Slug, string Title, string? ClientName, string? Sector, string Summary,
    string Challenge, string Solution, string Outcome, Guid? CoverImageId,
    bool IsPublished, bool IsFeatured, int SortOrder, IReadOnlyList<Guid>? TechnologyIds,
    string? SeoTitle, string? SeoDescription, Guid? Version);

// --- Teknolojiler
public sealed record AdminTechnologyDto(Guid Id, string Name, TechnologyCategory Category, string? Icon, int SortOrder, bool IsPublished, Guid Version);

public sealed record UpsertTechnologyRequest(string Name, TechnologyCategory Category, string? Icon, int SortOrder, bool IsPublished, Guid? Version);

// --- Ekip
public sealed record AdminTeamMemberDto(
    Guid Id, string Name, string RoleTitle, string Bio, Guid? PhotoId, MediaDto? Photo,
    string? LinkedInUrl, int SortOrder, bool IsPublished, Guid Version);

public sealed record UpsertTeamMemberRequest(
    string Name, string RoleTitle, string Bio, Guid? PhotoId, string? LinkedInUrl, int SortOrder, bool IsPublished, Guid? Version);

// --- Blog
/// <summary>Panel listesi için hafif yazı özeti (içerik gövdesi taşınmaz).</summary>
public sealed record AdminPostListItemDto(
    Guid Id, string Slug, string Title, MediaDto? CoverImage, PostStatus Status, bool IsScheduled, DateTimeOffset? PublishedAt,
    bool IsFeatured, Guid? CategoryId, CategoryRefDto? Category, IReadOnlyList<TagRefDto> Tags, int CommentCount,
    int PendingCommentCount, DateTimeOffset UpdatedAt, Guid Version);

public sealed record AdminPostDto(
    Guid Id, string Slug, string Title, string Excerpt, string BodyMarkdown, Guid? CoverImageId, MediaDto? CoverImage,
    PostStatus Status, DateTimeOffset? PublishedAt, string? SeoTitle, string? SeoDescription, DateTimeOffset UpdatedAt,
    Guid? CategoryId, IReadOnlyList<Guid> TagIds, bool IsFeatured, string? AuthorName, Guid Version);

public sealed record UpsertPostRequest(
    string? Slug, string Title, string Excerpt, string BodyMarkdown, Guid? CoverImageId,
    PostStatus Status, DateTimeOffset? PublishedAt, string? SeoTitle, string? SeoDescription,
    Guid? CategoryId, IReadOnlyList<Guid>? TagIds, bool IsFeatured, Guid? Version);

/// <summary>Listeden hızlı işlem: yayınla/yayından kaldır, öne çıkar.</summary>
public sealed record QuickUpdatePostRequest(PostStatus? Status, bool? IsFeatured, Guid Version);

// --- Kategoriler ve etiketler
public sealed record AdminCategoryDto(
    Guid Id, string Name, string Slug, string? Description, string Color, int PostCount, DateTimeOffset CreatedAt);

public sealed record UpsertCategoryRequest(string Name, string? Slug, string? Description, string Color);

public sealed record AdminTagDto(Guid Id, string Name, string Slug, int PostCount, DateTimeOffset CreatedAt);

public sealed record UpsertTagRequest(string Name, string? Slug);

// --- Yorumlar
public sealed record AdminCommentDto(
    Guid Id, Guid PostId, string PostTitle, string PostSlug, Guid? ParentId, string AuthorName, string? AuthorEmail,
    string Body, CommentStatus Status, bool IsStaffReply, int ReplyCount, DateTimeOffset CreatedAt);

public sealed record UpdateCommentStatusRequest(CommentStatus Status);

public sealed record ReplyCommentRequest(string Body);

// --- Yapay zekâ (OpenRouter)
public sealed record AiModelDto(string Id, string Name, bool IsFree, decimal? PromptPricePerMillion, decimal? CompletionPricePerMillion);

public sealed record AiDefaultsDto(
    string? TextModel, string? ImageModel, string? ResearchModel, string Style, string Depth, string Language, bool WebSearch);

public sealed record AiModelsDto(bool Configured, IReadOnlyList<AiModelDto> Text, IReadOnlyList<AiModelDto> Image, AiDefaultsDto Defaults);

public sealed record AiGenerateFields(bool Title, bool Excerpt, bool Content, bool Seo, bool Category, bool Tags, bool Cover);

public sealed record AiGeneratePostRequest(
    string Topic, AiGenerateFields Fields, string? Style, string? Depth, string? Language, bool? WebSearch,
    string? Model, string? ImageModel);

public sealed record AiSourceDto(int Number, string Title, string Url);

public sealed record AiGeneratePostResult(
    string? Title, string? Excerpt, string? Content, string? SeoTitle, string? SeoDescription,
    string? Category, IReadOnlyList<string> Tags, MediaAssetDto? Cover, IReadOnlyList<AiSourceDto> Sources,
    IReadOnlyList<string> Warnings, string Model);

public sealed record AiRewriteRequest(
    string Instruction, string? Title, string? Excerpt, string? Content, string? Language, string? Model);

public sealed record AiRewriteResult(string? Title, string? Excerpt, string? Content, string Model);

// --- Talepler
public sealed record InquiryListItemDto(
    Guid Id, string Name, string Email, string? Company, string? ServiceInterest, InquiryStatus Status, DateTimeOffset CreatedAt);

public sealed record InquiryDetailDto(
    Guid Id, string Name, string Email, string? Company, string? Phone, string? ServiceInterest, string Message,
    InquiryStatus Status, DateTimeOffset ConsentedAt, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

public sealed record UpdateInquiryStatusRequest(InquiryStatus Status);
