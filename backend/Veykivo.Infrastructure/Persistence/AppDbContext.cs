using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Veykivo.Application.Abstractions;
using Veykivo.Application.Common;
using Veykivo.Domain.Entities;
using Veykivo.Infrastructure.Identity;

namespace Veykivo.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>(options), IAppDbContext
{
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectTechnology> ProjectTechnologies => Set<ProjectTechnology>();
    public DbSet<Technology> Technologies => Set<Technology>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
    public DbSet<Inquiry> Inquiries => Set<Inquiry>();
    public DbSet<SiteSetting> SiteSettings => Set<SiteSetting>();
    public DbSet<PendingFileDeletion> PendingFileDeletions => Set<PendingFileDeletion>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<PostTag> PostTags => Set<PostTag>();
    public DbSet<Comment> Comments => Set<Comment>();

    public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<IVersionedEntity>().Where(e => e.State == EntityState.Modified))
            entry.Entity.Version = Guid.NewGuid();
        try { return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            throw new ConflictException("Aynı slug veya ada sahip bir kayıt zaten var.");
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.ForeignKeyViolation })
        {
            throw new ConflictException("İlişkili kayıt değişti veya silindi. Sayfayı yenileyip tekrar deneyin.");
        }
    }

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<PendingFileDeletion>(e =>
        {
            e.Property(x => x.StorageKey).HasMaxLength(300);
            e.HasIndex(x => x.CreatedAt);
        });

        // Identity tablolarını plandaki adlandırmaya yaklaştır.
        b.Entity<AppUser>().ToTable("Users");
        b.Entity<IdentityRole<Guid>>().ToTable("Roles");
        b.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
        b.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
        b.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
        b.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");
        b.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");

        b.Entity<MediaAsset>(e =>
        {
            e.Property(x => x.StorageKey).HasMaxLength(300);
            e.Property(x => x.Url).HasMaxLength(500);
            e.Property(x => x.MimeType).HasMaxLength(60);
            e.Property(x => x.AltText).HasMaxLength(300);
            e.HasIndex(x => x.StorageKey).IsUnique();
            e.HasIndex(x => x.CreatedAt);
        });

        b.Entity<Service>(e =>
        {
            e.Property(x => x.Slug).HasMaxLength(160);
            e.Property(x => x.Title).HasMaxLength(160);
            e.Property(x => x.Summary).HasMaxLength(400);
            e.Property(x => x.Icon).HasMaxLength(60);
            e.Property(x => x.SeoTitle).HasMaxLength(70);
            e.Property(x => x.SeoDescription).HasMaxLength(170);
            e.HasIndex(x => x.Slug).IsUnique();
            e.HasIndex(x => new { x.IsPublished, x.SortOrder });
            e.HasOne(x => x.CoverImage).WithMany().HasForeignKey(x => x.CoverImageId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Project>(e =>
        {
            e.Property(x => x.Slug).HasMaxLength(160);
            e.Property(x => x.Title).HasMaxLength(160);
            e.Property(x => x.ClientName).HasMaxLength(160);
            e.Property(x => x.Sector).HasMaxLength(80);
            e.Property(x => x.Summary).HasMaxLength(400);
            e.Property(x => x.SeoTitle).HasMaxLength(70);
            e.Property(x => x.SeoDescription).HasMaxLength(170);
            e.HasIndex(x => x.Slug).IsUnique();
            e.HasIndex(x => new { x.IsPublished, x.SortOrder });
            e.HasOne(x => x.CoverImage).WithMany().HasForeignKey(x => x.CoverImageId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<ProjectTechnology>(e =>
        {
            e.HasKey(x => new { x.ProjectId, x.TechnologyId });
            e.HasOne(x => x.Project).WithMany(p => p.Technologies).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Technology).WithMany().HasForeignKey(x => x.TechnologyId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Technology>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(80);
            e.Property(x => x.Icon).HasMaxLength(60);
            e.Property(x => x.Category).HasConversion<string>().HasMaxLength(30);
            e.HasIndex(x => x.Name).IsUnique();
        });

        b.Entity<TeamMember>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(120);
            e.Property(x => x.RoleTitle).HasMaxLength(120);
            e.Property(x => x.Bio).HasMaxLength(1200);
            e.Property(x => x.LinkedInUrl).HasMaxLength(300);
            e.HasOne(x => x.Photo).WithMany().HasForeignKey(x => x.PhotoId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Post>(e =>
        {
            e.Property(x => x.Slug).HasMaxLength(160);
            e.Property(x => x.Title).HasMaxLength(200);
            e.Property(x => x.Excerpt).HasMaxLength(400);
            e.Property(x => x.SeoTitle).HasMaxLength(70);
            e.Property(x => x.SeoDescription).HasMaxLength(170);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.AuthorName).HasMaxLength(120);
            e.HasIndex(x => new { x.Status, x.PublishedAt });
            e.HasIndex(x => x.CategoryId);
            e.HasOne(x => x.CoverImage).WithMany().HasForeignKey(x => x.CoverImageId).OnDelete(DeleteBehavior.SetNull);
            // Kategori silinirse yazılar kategorisiz kalır.
            e.HasOne(x => x.Category).WithMany(c => c.Posts).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Category>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(60);
            e.Property(x => x.Slug).HasMaxLength(80);
            e.Property(x => x.Description).HasMaxLength(200);
            e.Property(x => x.Color).HasMaxLength(9);
            e.HasIndex(x => x.Slug).IsUnique();
        });

        b.Entity<Tag>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(40);
            e.Property(x => x.Slug).HasMaxLength(60);
            e.HasIndex(x => x.Slug).IsUnique();
        });

        b.Entity<PostTag>(e =>
        {
            e.HasKey(x => new { x.PostId, x.TagId });
            e.HasIndex(x => x.TagId);
            e.HasOne(x => x.Post).WithMany(p => p.Tags).HasForeignKey(x => x.PostId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Tag).WithMany(t => t.Posts).HasForeignKey(x => x.TagId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Comment>(e =>
        {
            e.Property(x => x.AuthorName).HasMaxLength(60);
            e.Property(x => x.AuthorEmail).HasMaxLength(200);
            e.Property(x => x.Body).HasMaxLength(2000);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(x => new { x.PostId, x.Status, x.CreatedAt });
            e.HasIndex(x => new { x.Status, x.CreatedAt });
            e.HasOne(x => x.Post).WithMany(p => p.Comments).HasForeignKey(x => x.PostId).OnDelete(DeleteBehavior.Cascade);
            // Ana yorum silinince yanıtları da silinir.
            e.HasOne(x => x.Parent).WithMany(c => c.Replies).HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Inquiry>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(120);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.Company).HasMaxLength(160);
            e.Property(x => x.Phone).HasMaxLength(40);
            e.Property(x => x.ServiceInterest).HasMaxLength(160);
            e.Property(x => x.Message).HasMaxLength(4000);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(x => new { x.Status, x.CreatedAt });
        });

        b.Entity<SiteSetting>(e =>
        {
            e.HasKey(x => x.Key);
            e.Property(x => x.Key).HasMaxLength(80);
            e.Property(x => x.Value).HasMaxLength(1000);
        });

        foreach (var entity in b.Model.GetEntityTypes().Where(e => typeof(IVersionedEntity).IsAssignableFrom(e.ClrType)))
            b.Entity(entity.ClrType).Property(nameof(IVersionedEntity.Version)).IsConcurrencyToken();
    }
}
