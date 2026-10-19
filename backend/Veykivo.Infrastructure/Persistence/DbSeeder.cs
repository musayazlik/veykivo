using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Veykivo.Domain.Entities;
using Veykivo.Domain.Enums;
using Veykivo.Infrastructure.Identity;

namespace Veykivo.Infrastructure.Persistence;

/// <summary>
/// İlk kurulum verisi: Admin rolü + hesap (yapılandırmadan) ve örnek içerik.
/// Her bölüm yalnızca ilgili tablo boşsa çalışır; mevcut veriye dokunmaz.
/// Örnek içerikler yayın öncesi gerçek içeriklerle değiştirilmelidir.
/// </summary>
public sealed class DbSeeder(
    AppDbContext db,
    UserManager<AppUser> users,
    RoleManager<IdentityRole<Guid>> roles,
    IConfiguration config,
    ILogger<DbSeeder> logger)
{
    public async Task SeedAsync(CancellationToken ct = default)
    {
        await SeedAdminAsync();
        if (config.GetValue("Seed:SampleContent", true))
        {
            await SeedContentAsync(ct);
            await SeedBlogTaxonomyAsync(ct);
        }
    }

    private async Task SeedAdminAsync()
    {
        if (!await roles.RoleExistsAsync(Roles.Admin))
            await roles.CreateAsync(new IdentityRole<Guid>(Roles.Admin));

        var email = config["Seed:AdminEmail"];
        var password = config["Seed:AdminPassword"];
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogInformation("Seed:AdminEmail/Seed:AdminPassword tanımlı değil; admin hesabı oluşturulmadı.");
            return;
        }
        if (await users.FindByEmailAsync(email) is not null) return;

        var user = new AppUser { UserName = email, Email = email, EmailConfirmed = true, DisplayName = "Yönetici" };
        var result = await users.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            logger.LogError("Admin hesabı oluşturulamadı: {Errors}", string.Join("; ", result.Errors.Select(e => e.Description)));
            return;
        }
        await users.AddToRoleAsync(user, Roles.Admin);
        logger.LogInformation("Admin hesabı oluşturuldu: {Email}", email);
    }

    private MediaAsset Img(string url, string alt) =>
        new() { StorageKey = $"static:{url}", Url = url, MimeType = "image/jpeg", AltText = alt };

    private async Task SeedContentAsync(CancellationToken ct)
    {
        if (!await db.SiteSettings.AnyAsync(ct))
        {
            db.SiteSettings.AddRange(
                new SiteSetting { Key = SiteSettingKeys.CompanyName, Value = "Veykivo Yazılım" },
                new SiteSetting { Key = SiteSettingKeys.CompanyTagline, Value = "İşletmenize özel yazılım sistemleri" },
                new SiteSetting { Key = SiteSettingKeys.ContactEmail, Value = "merhaba@veykivo.com" },
                new SiteSetting { Key = SiteSettingKeys.ContactPhone, Value = "+90 212 000 00 00" },
                new SiteSetting { Key = SiteSettingKeys.ContactAddress, Value = "Maslak Mah. Büyükdere Cad. No:0, Sarıyer / İstanbul" },
                new SiteSetting { Key = SiteSettingKeys.WorkingHours, Value = "Hafta içi 09:00 – 18:00" },
                new SiteSetting { Key = SiteSettingKeys.SocialLinkedIn, Value = "https://www.linkedin.com/" },
                new SiteSetting { Key = SiteSettingKeys.SocialGitHub, Value = "https://github.com/" },
                new SiteSetting { Key = SiteSettingKeys.SocialInstagram, Value = "" },
                new SiteSetting { Key = SiteSettingKeys.SocialX, Value = "" },
                new SiteSetting { Key = SiteSettingKeys.SeoDefaultTitle, Value = "Veykivo — Kurumsal Yazılım Geliştirme" },
                new SiteSetting { Key = SiteSettingKeys.SeoDefaultDescription, Value = "Veykivo; işletmelere özel yazılım, web ve mobil uygulama, ERP/CRM ve otomasyon çözümleri geliştirir." },
                new SiteSetting { Key = SiteSettingKeys.NotificationEmail, Value = "" });
        }

        var techByName = new Dictionary<string, Technology>();
        if (!await db.Technologies.AnyAsync(ct))
        {
            (string Name, TechnologyCategory Cat)[] techs =
            [
                ("Next.js", TechnologyCategory.Frontend), ("React", TechnologyCategory.Frontend),
                ("TypeScript", TechnologyCategory.Frontend), ("Tailwind CSS", TechnologyCategory.Frontend),
                (".NET", TechnologyCategory.Backend), ("ASP.NET Core", TechnologyCategory.Backend),
                ("Node.js", TechnologyCategory.Backend), ("Python", TechnologyCategory.Backend),
                ("React Native", TechnologyCategory.Mobile), ("Flutter", TechnologyCategory.Mobile),
                ("PostgreSQL", TechnologyCategory.Database), ("SQL Server", TechnologyCategory.Database),
                ("Redis", TechnologyCategory.Database),
                ("Docker", TechnologyCategory.Infrastructure), ("Kubernetes", TechnologyCategory.Infrastructure),
                ("Azure", TechnologyCategory.Infrastructure), ("AWS", TechnologyCategory.Infrastructure),
                ("OpenAI API", TechnologyCategory.AI), ("LangChain", TechnologyCategory.AI),
            ];
            var order = 0;
            foreach (var (name, cat) in techs)
            {
                var t = new Technology { Name = name, Category = cat, SortOrder = order++, IsPublished = true };
                techByName[name] = t;
                db.Technologies.Add(t);
            }
        }

        if (!await db.Services.AnyAsync(ct))
        {
            db.Services.AddRange(
                Svc(0, "ozel-yazilim-gelistirme", "Özel Yazılım Geliştirme", "code-xml",
                    "Hazır paketlerin karşılamadığı iş süreçleri için sıfırdan, ölçeklenebilir yazılım.",
                    "/images/services/ozel-yazilim.jpg", "Ekip, beyaz tahta üzerinde sistem akışını planlıyor"),
                Svc(1, "web-uygulama-gelistirme", "Web Uygulama Geliştirme", "app-window",
                    "Tarayıcıda çalışan, hızlı, güvenli ve arama motorlarına uygun kurumsal web uygulamaları.",
                    "/images/services/web-uygulama.jpg", "Dizüstü bilgisayarda açık bir web uygulaması paneli"),
                Svc(2, "mobil-uygulama-gelistirme", "Mobil Uygulama Geliştirme", "smartphone",
                    "iOS ve Android için tek kod tabanıyla saha ekiplerine ve müşterilere uygulamalar.",
                    "/images/services/mobil.jpg", "Elde tutulan akıllı telefonda mobil uygulama ekranı"),
                Svc(3, "erp-ve-crm-cozumleri", "ERP ve CRM Çözümleri", "boxes",
                    "Stok, satış, müşteri ve finans süreçlerinizi tek ekrandan yöneten sistemler.",
                    "/images/services/erp-crm.jpg", "Depoda tablet ile stok sayımı yapan çalışan"),
                Svc(4, "yapay-zeka-ve-otomasyon", "Yapay Zekâ ve Otomasyon", "workflow",
                    "Tekrarlayan işleri otomatikleştiren, belgeleri okuyan ve öneri üreten akıllı araçlar.",
                    "/images/services/yapay-zeka.jpg", "Ekranda otomasyon akış diyagramı"),
                Svc(5, "yazilim-danismanligi", "Yazılım Danışmanlığı", "compass",
                    "Mimari, teknoloji seçimi ve mevcut sistemlerin modernizasyonu için bağımsız yol haritası.",
                    "/images/services/danismanlik.jpg", "Toplantı masasında yazılım mimarisi üzerine konuşan iki kişi"));
        }

        if (!await db.Projects.AnyAsync(ct) && techByName.Count > 0)
        {
            Project P(int order, string slug, string title, string client, string sector, string summary,
                string challenge, string solution, string outcome, string img, string alt, params string[] tech)
            {
                var p = new Project
                {
                    Slug = slug, Title = title, ClientName = client, Sector = sector, Summary = summary,
                    Challenge = challenge, Solution = solution, Outcome = outcome, SortOrder = order,
                    IsFeatured = order < 3, CoverImage = Img(img, alt),
                };
                p.SetPublished(true, DateTimeOffset.UtcNow);
                foreach (var t in tech) p.Technologies.Add(new ProjectTechnology { Project = p, Technology = techByName[t] });
                return p;
            }

            db.Projects.AddRange(
                P(0, "lojistik-filo-takip-platformu", "Filo ve sevkiyat takip platformu", "Örnek Lojistik A.Ş.", "Lojistik",
                    "120 araçlık filonun rotalarını, teslimatlarını ve yakıt giderini tek panelden izleyen web ve mobil sistem.",
                    "Sevkiyatlar telefon ve Excel tabloları üzerinden takip ediliyordu. Teslimat gecikmeleri müşteriye ulaşmadan fark edilemiyor, yakıt ve bakım giderleri ay sonunda elle toplanıyordu.",
                    "Sürücüler için çevrimdışı çalışabilen bir mobil uygulama, operasyon ekibi için canlı harita ve uyarı paneli geliştirdik. Mevcut muhasebe yazılımıyla gece çalışan bir entegrasyon kurduk.",
                    "İlk üç ayda gecikmeli teslimat oranı belirgin şekilde azaldı; ay sonu gider raporu artık otomatik hazırlanıyor.",
                    "/images/projects/lojistik.jpg", "Lojistik deposunda yükleme bekleyen kamyonlar",
                    "Next.js", "ASP.NET Core", "React Native", "PostgreSQL", "Docker"),
                P(1, "uretim-planlama-erp", "Üretim planlama ve stok ERP'si", "Örnek Metal San. Tic.", "Üretim",
                    "Sipariş, reçete, stok ve üretim emirlerini birbirine bağlayan, fabrikaya özel ERP modülleri.",
                    "Hazır ERP paketi fabrikanın fason üretim akışına uymuyor, planlama ekibi paralel tablolar tutmak zorunda kalıyordu.",
                    "Süreç atölyeleriyle iş akışını çıkardık; sipariş-reçete-üretim emri zincirini modüler bir monolit olarak geliştirdik. Atölye ekranları tablet için sadeleştirildi.",
                    "Planlama ekibi paralel tabloları bıraktı; stok sayım farkları görünür hale geldi.",
                    "/images/projects/uretim.jpg", "Üretim tesisinde CNC tezgâhı başında çalışan operatör",
                    "React", ".NET", "SQL Server", "Azure"),
                P(2, "saglik-randevu-ve-hasta-portali", "Klinik randevu ve hasta portalı", "Örnek Sağlık Grubu", "Sağlık",
                    "Beş şubeli klinik zinciri için çevrim içi randevu, hatırlatma ve sonuç görüntüleme portalı.",
                    "Randevuların çoğu telefonla alınıyor, gelmeyen hasta oranı yüksekti ve çağrı merkezi yoğun saatlerde yetişemiyordu.",
                    "KVKK gereksinimleriyle uyumlu bir hasta portalı, SMS hatırlatmaları ve hekim takvimi senkronizasyonu geliştirdik.",
                    "Randevuların önemli bir kısmı çevrim içi kanala taşındı, çağrı merkezi yükü azaldı.",
                    "/images/projects/saglik.jpg", "Klinik bekleme alanında tablet kullanan hasta",
                    "Next.js", "TypeScript", "Node.js", "PostgreSQL", "AWS"),
                P(3, "belge-okuma-otomasyonu", "Fatura ve belge okuma otomasyonu", "Örnek Finans Hizmetleri", "Finans",
                    "Gelen fatura ve irsaliyeleri okuyup muhasebe sistemine aktaran yapay zekâ destekli iş akışı.",
                    "Her ay binlerce belge elle sisteme giriliyor, hatalar kapanış dönemlerinde fark ediliyordu.",
                    "Belge sınıflandırma ve alan çıkarma için bir yapay zekâ hattı kurduk; düşük güvenli sonuçlar insan onayına düşüyor.",
                    "Elle veri girişi büyük ölçüde azaldı, kapanış süresi kısaldı.",
                    "/images/projects/finans.jpg", "Masada fatura ve hesap makinesiyle çalışan muhasebeci",
                    "Python", "OpenAI API", "PostgreSQL", "Docker"));
        }

        if (!await db.TeamMembers.AnyAsync(ct))
        {
            TeamMember M(int o, string name, string role, string bio, string img) => new()
            {
                Name = name, RoleTitle = role, Bio = bio, SortOrder = o, IsPublished = true,
                LinkedInUrl = "https://www.linkedin.com/", Photo = Img(img, $"{name} portresi"),
            };
            db.TeamMembers.AddRange(
                M(0, "Ad Soyad", "Kurucu & Yazılım Mimarı", "Kurumsal sistemlerde 12 yıllık deneyim. Projelerin teknik yönünü ve mimari kararlarını yönetir.", "/images/team/uye-1.jpg"),
                M(1, "Ad Soyad", "Ürün Yöneticisi", "İş birimleriyle süreç atölyeleri yürütür; ihtiyaçları önceliklendirilmiş bir yol haritasına çevirir.", "/images/team/uye-2.jpg"),
                M(2, "Ad Soyad", "Kıdemli Full-Stack Geliştirici", ".NET ve React ekosisteminde ölçeklenebilir web uygulamaları geliştirir.", "/images/team/uye-3.jpg"),
                M(3, "Ad Soyad", "UI/UX Tasarımcı", "Karmaşık iş ekranlarını sade, öğrenmesi kolay arayüzlere dönüştürür.", "/images/team/uye-4.jpg"));
        }

        if (!await db.Posts.AnyAsync(ct))
        {
            var now = DateTimeOffset.UtcNow;
            Post B(int daysAgo, string slug, string title, string excerpt, string body, string img, string alt) => new()
            {
                Slug = slug, Title = title, Excerpt = excerpt, BodyMarkdown = body, Status = PostStatus.Published,
                PublishedAt = now.AddDays(-daysAgo), CoverImage = Img(img, alt),
            };
            db.Posts.AddRange(
                B(4, "hazir-paket-mi-ozel-yazilim-mi", "Hazır paket mi, özel yazılım mı?",
                    "İşletmeniz için doğru kararı verirken bakmanız gereken beş soru.",
                    BlogBody1, "/images/blog/karar.jpg", "Masada iki seçenek arasında not alan yönetici"),
                B(12, "erp-projesine-baslamadan-once", "ERP projesine başlamadan önce yapılması gerekenler",
                    "ERP projelerinin çoğu yazılım yüzünden değil, hazırlık eksikliği yüzünden zorlanır.",
                    BlogBody2, "/images/blog/erp.jpg", "Toplantı odasında süreç haritası üzerinde çalışan ekip"),
                B(21, "is-sureclerinde-yapay-zeka-nereden-baslamali", "İş süreçlerinde yapay zekâ: nereden başlamalı?",
                    "Küçük, ölçülebilir ve geri alınabilir ilk adımlarla yapay zekâdan gerçek fayda almak.",
                    BlogBody3, "/images/blog/yapay-zeka.jpg", "Ekranda veri grafikleri inceleyen analist"));
        }

        await db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Kategori ve etiket yoksa örneklerini oluşturur ve kategorisiz mevcut yazılara atar
    /// (yayındaki yazılar için kategori + etiket zorunluluğu sonradan eklendiği için).
    /// </summary>
    private async Task SeedBlogTaxonomyAsync(CancellationToken ct)
    {
        if (await db.Categories.AnyAsync(ct)) return;

        var strategy = new Category { Name = "Dijital Dönüşüm", Slug = "dijital-donusum", Color = "#2F6F6A", Description = "Yazılım yatırımı kararları ve süreç iyileştirme." };
        var erp = new Category { Name = "ERP ve Süreçler", Slug = "erp-ve-surecler", Color = "#B7791F", Description = "ERP, CRM ve operasyon yönetimi." };
        var aiCategory = new Category { Name = "Yapay Zekâ", Slug = "yapay-zeka", Color = "#5B4FCF", Description = "İş süreçlerinde yapay zekâ ve otomasyon." };
        db.Categories.AddRange(strategy, erp, aiCategory);

        Tag T(string name, string slug) => new() { Name = name, Slug = slug };
        var tags = new Dictionary<string, Tag>
        {
            ["ozel-yazilim"] = T("özel yazılım", "ozel-yazilim"),
            ["karar-verme"] = T("karar verme", "karar-verme"),
            ["erp"] = T("erp", "erp"),
            ["proje-yonetimi"] = T("proje yönetimi", "proje-yonetimi"),
            ["otomasyon"] = T("otomasyon", "otomasyon"),
            ["kvkk"] = T("kvkk", "kvkk"),
        };
        db.Tags.AddRange(tags.Values);

        var plan = new Dictionary<string, (Category Category, string[] Tags, bool Featured)>
        {
            ["hazir-paket-mi-ozel-yazilim-mi"] = (strategy, ["ozel-yazilim", "karar-verme"], true),
            ["erp-projesine-baslamadan-once"] = (erp, ["erp", "proje-yonetimi"], false),
            ["is-sureclerinde-yapay-zeka-nereden-baslamali"] = (aiCategory, ["otomasyon", "kvkk"], false),
        };
        var posts = await db.Posts.Include(p => p.Tags).Where(p => p.CategoryId == null).ToListAsync(ct);
        foreach (var post in posts)
        {
            if (!plan.TryGetValue(post.Slug, out var item)) continue;
            post.Category = item.Category;
            post.IsFeatured = item.Featured;
            post.AuthorName ??= "Veykivo Editör";
            foreach (var slug in item.Tags) post.Tags.Add(new PostTag { Post = post, Tag = tags[slug] });
            if (item.Featured)
            {
                var first = db.Comments.Add(new Comment
                {
                    Post = post, AuthorName = "Elif K.", Body = "Karar sürecimizde tam olarak bu soruları tartışıyorduk, liste çok işimize yaradı.",
                    Status = Domain.Enums.CommentStatus.Approved, CreatedAt = DateTimeOffset.UtcNow.AddDays(-2),
                }).Entity;
                db.Comments.Add(new Comment
                {
                    Post = post, Parent = first, AuthorName = "Veykivo", IsStaffReply = true,
                    Body = "Teşekkürler Elif Hanım! Toplam sahip olma maliyeti hesabı için şablonumuzu isterseniz paylaşabiliriz.",
                    Status = Domain.Enums.CommentStatus.Approved, CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
                });
                db.Comments.Add(new Comment
                {
                    Post = post, AuthorName = "Mert A.", AuthorEmail = "mert@ornek.com",
                    Body = "Entegrasyon katmanı ile başlamak mantıklı görünüyor. Bunun maliyeti genelde nasıl hesaplanıyor?",
                    Status = Domain.Enums.CommentStatus.Pending, CreatedAt = DateTimeOffset.UtcNow.AddHours(-5),
                });
            }
        }
        await db.SaveChangesAsync(ct);
    }

    private Service Svc(int order, string slug, string title, string icon, string summary, string img, string alt) => new()
    {
        Slug = slug, Title = title, Icon = icon, Summary = summary, SortOrder = order, IsPublished = true,
        CoverImage = Img(img, alt),
        SeoTitle = $"{title} | Veykivo",
        SeoDescription = summary,
        Body = $"""
            ## Hangi sorunu çözer?

            {summary} Süreçleriniz büyüdükçe tablolar, e-postalar ve birbirinden kopuk araçlar ekibinizin zamanını tüketir. Bu hizmet, işinizin gerçekte nasıl yürüdüğünü temel alarak tek ve tutarlı bir sistem kurar.

            ## Nasıl çalışıyoruz?

            - **Keşif:** Süreç atölyeleriyle mevcut akışı ve darboğazları birlikte çıkarıyoruz.
            - **Tasarım:** Ekranları ve veri modelini prototip üzerinde doğruluyoruz.
            - **Geliştirme:** İki haftalık döngülerle çalışan sürümler teslim ediyoruz.
            - **Yayın ve destek:** Canlıya alma, eğitim ve bakım süreçlerini üstleniyoruz.

            ## Kapsam

            - İhtiyaç analizi ve teknik yol haritası
            - Arayüz tasarımı ve kullanıcı testleri
            - Backend, veritabanı ve entegrasyonlar
            - Güvenlik, performans ve otomatik testler
            - Dokümantasyon ve ekip eğitimi
            """,
    };

    private const string BlogBody1 = """
        Her işletme bir noktada aynı soruyla karşılaşır: piyasadaki hazır bir paketi mi kullanmalı, yoksa kendi süreçlerine göre yazılım mı geliştirmeli?

        ## 1. Süreciniz sizi farklılaştırıyor mu?

        Muhasebe veya bordro gibi standart süreçler için hazır paketler genellikle doğru tercihtir. Ancak rekabet avantajınız belirli bir operasyon biçiminden geliyorsa, o süreci bir paketin kalıbına sokmak avantajınızı aşındırabilir.

        ## 2. Kaç farklı araç arasında veri taşıyorsunuz?

        Ekibiniz aynı veriyi üç farklı sisteme elle giriyorsa, sorun çoğu zaman tek bir yazılım değil, sistemler arasındaki boşluktur. Bu durumda tam bir özel yazılım yerine entegrasyon katmanı yeterli olabilir.

        ## 3. Toplam sahip olma maliyeti nedir?

        Lisans ücretleri, kullanıcı başı maliyetler ve özelleştirme bedelleri beş yıllık bir perspektifle hesaplanmalıdır.

        ## 4. Kim değiştirebilecek?

        İş kuralları değiştiğinde yazılımı kimin, ne kadar sürede güncelleyebileceği kritik bir sorudur.

        ## 5. Veri kimin elinde?

        Verinize istediğiniz formatta, istediğiniz zaman erişebilmek uzun vadede en değerli güvencelerden biridir.

        > Kısa cevap: standart süreçler için hazır, sizi farklılaştıran süreçler için özel çözüm.
        """;

    private const string BlogBody2 = """
        ERP projeleri işletmelerin en uzun soluklu teknoloji yatırımlarındandır. Zorlanan projelere baktığımızda sorunun çoğunlukla yazılımdan önce başladığını görüyoruz.

        ## Süreçleri yazıya dökün

        Mevcut iş akışını kimin, hangi sırayla, hangi belgeyle yaptığını netleştirmeden yazılım seçmek, ölçü almadan elbise dikmeye benzer.

        ## Bir karar vericiyi sahiplendirin

        Departmanlar arası çatışan talepleri karara bağlayacak, yetkili bir proje sahibi olmalıdır.

        ## Veriyi temizleyin

        Yeni sisteme taşınacak stok kartları, müşteri kayıtları ve reçeteler önceden temizlenmelidir. Kirli veri yeni sistemde de kirli kalır.

        ## Aşamalı ilerleyin

        Tüm modülleri aynı gün canlıya almak yerine, en çok acı veren süreçten başlayıp adım adım genişlemek riski azaltır.
        """;

    private const string BlogBody3 = """
        Yapay zekâ konusunda en sık duyduğumuz soru "nereden başlamalıyız?" oluyor. Cevabımız genellikle aynı: küçük, ölçülebilir ve geri alınabilir bir adımla.

        ## Tekrarlayan ve kurala dayalı işleri listeleyin

        Belge okuma, e-posta sınıflandırma, talep yönlendirme gibi işler iyi başlangıç noktalarıdır.

        ## İnsanı döngüde tutun

        İlk aşamada yapay zekânın önerdiği sonucu bir çalışanın onaylaması hem güven oluşturur hem de sistemin hatalarını görünür kılar.

        ## Başarıyı önceden tanımlayın

        "Belge başına işlem süresi" veya "elle düzeltme oranı" gibi tek bir ölçüt seçin ve başlamadan önce mevcut değeri ölçün.

        ## Verinizi koruyun

        Kişisel ve ticari verilerin hangi servise, hangi koşullarla gönderildiği KVKK açısından baştan değerlendirilmelidir.
        """;
}
