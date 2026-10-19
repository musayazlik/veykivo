using Veykivo.Domain.Enums;

namespace Veykivo.Application.Contracts;

public sealed record MediaDto(Guid Id, string Url, string AltText);

public sealed record ServiceListItemDto(string Slug, string Title, string Summary, string? Icon, MediaDto? CoverImage);

public sealed record ServiceDetailDto(
    string Slug, string Title, string Summary, string Body, string? Icon, MediaDto? CoverImage,
    string? SeoTitle, string? SeoDescription, DateTimeOffset UpdatedAt);

public sealed record TechnologyDto(Guid Id, string Name, TechnologyCategory Category, string? Icon);

public sealed record ProjectListItemDto(
    string Slug, string Title, string? ClientName, string? Sector, string Summary, MediaDto? CoverImage,
    bool IsFeatured, DateTimeOffset? PublishedAt, IReadOnlyList<string> Technologies);

public sealed record ProjectDetailDto(
    string Slug, string Title, string? ClientName, string? Sector, string Summary,
    string Challenge, string Solution, string Outcome, MediaDto? CoverImage, DateTimeOffset? PublishedAt,
    IReadOnlyList<TechnologyDto> Technologies, string? SeoTitle, string? SeoDescription, DateTimeOffset UpdatedAt);

public sealed record TeamMemberDto(Guid Id, string Name, string RoleTitle, string Bio, MediaDto? Photo, string? LinkedInUrl);

public sealed record CategoryRefDto(string Name, string Slug, string Color);

public sealed record TagRefDto(string Name, string Slug);

public sealed record PostListItemDto(
    string Slug, string Title, string Excerpt, MediaDto? CoverImage, DateTimeOffset PublishedAt, int ReadingMinutes,
    CategoryRefDto? Category, IReadOnlyList<TagRefDto> Tags, bool IsFeatured);

public sealed record PublicCommentDto(
    Guid Id, string AuthorName, string Body, bool IsStaffReply, DateTimeOffset CreatedAt, IReadOnlyList<PublicCommentDto> Replies);

public sealed record PostDetailDto(
    string Slug, string Title, string Excerpt, string BodyMarkdown, MediaDto? CoverImage, DateTimeOffset PublishedAt,
    int ReadingMinutes, string? SeoTitle, string? SeoDescription, DateTimeOffset UpdatedAt,
    CategoryRefDto? Category, IReadOnlyList<TagRefDto> Tags, string? AuthorName,
    IReadOnlyList<PublicCommentDto> Comments, int CommentCount);

public sealed record BlogCategoryDto(string Name, string Slug, string Color, string? Description, int PostCount);

public sealed record BlogTagDto(string Name, string Slug, int PostCount);

public sealed record CreateCommentRequest(
    string AuthorName, string? AuthorEmail, string Body, Guid? ParentId,
    // Honeypot: gerçek kullanıcılar bu alanı görmez ve boş bırakır.
    string? Website);

public sealed record CommentCreatedDto(bool Pending);

public sealed record SitemapEntryDto(string Type, string Slug, DateTimeOffset UpdatedAt);

public sealed record CreateInquiryRequest(
    string Name, string Email, string? Company, string? Phone, string? ServiceInterest, string Message,
    bool Consent,
    // Honeypot: gerçek kullanıcılar bu alanı görmez ve boş bırakır.
    string? Website);

public sealed record InquiryCreatedDto(Guid? Id);
