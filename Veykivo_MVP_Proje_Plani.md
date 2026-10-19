# Veykivo Kurumsal Yazılım Şirketi Web Sitesi

**MVP Proje Planı — Sürüm 1.0**  
**Hazırlanma tarihi:** 19 Ekim 2026  
**Durum:** Geliştirme öncesi plan  
**Önerilen marka adı:** Veykivo (okunuşu: *Vey-ki-vo*)

## 1. Proje özeti

Veykivo, kurumsal yazılım geliştirme, işletmelere özel sistemler ve teknoloji danışmanlığı sunan bir şirket için önerilen çalışma adıdır. Bu projenin ilk sürümü, şirketin hizmetlerini anlaşılır biçimde anlatan, referanslarını sergileyen, organik aramalardan trafik alabilen ve ziyaretçileri teklif talebine yönlendiren profesyonel bir web sitesi olacaktır.

Sistem iki ana parçadan oluşur: ziyaretçilerin göreceği Next.js kurumsal web sitesi ve yalnızca yetkili kullanıcıların erişeceği yönetim paneli. Bunların verilerini ve iş kurallarını ASP.NET Core Web API yönetir.

**MVP hedefi:** Kapsamlı bir ERP ya da müşteri portalı kurmak değil; kurumsal kimliği, düzenlenebilir içerikleri, projeleri, blogu ve teklif toplama sürecini üretime hazır şekilde sunmaktır.

### 1.1 Başarı ölçütleri

- Ziyaretçi şirketi ve temel hizmetleri ana sayfadan anlayabilmeli.
- Hizmetler, projeler ve blog içerikleri kalıcı bağlantılarla açılabilmeli.
- Yetkili yönetici teknik destek almadan içerik ekleyip düzenleyebilmeli.
- İletişim/teklif talepleri veritabanına güvenle kaydedilmeli ve yönetim panelinde görülebilmeli.
- Site mobilde kullanılabilir, arama motorlarınca taranabilir ve temel güvenlik önlemleri etkin olmalı.

## 2. İsim ve marka çalışma kararı

**Veykivo** kısa, tek kelimelik, Türkçe ve İngilizce konuşan kişilerce görece kolay okunabilen bir marka adayıdır. Logo ve alan adı seçimi yapılmadan önce bu ismin kullanım hakkı kesinleştirilmelidir. Ekim 2026 tarihli ön web taramasında aynı yazımla belirgin bir kurumsal yazılım şirketi sonucu bulunmaması, marka tescilinin veya alan adının müsait olduğunun garantisi değildir.

**Yayın öncesi zorunlu isim kontrol listesi:**

1. TÜRKPATENT marka araştırması; özellikle ilgili yazılım ve teknoloji hizmet sınıfları.
2. WIPO Global Brand Database ve hedef pazarlara göre ek marka araştırması.
3. İstenen `.com` ve `.com.tr` alan adlarının kayıt kuruluşunda anlık kontrolü.
4. GitHub organizasyonu ve başlıca sosyal ağ kullanıcı adlarının kontrolü.
5. Gerçek şirket ünvanı, logo ve alan adının müşteri/kurucu tarafından onaylanması.

İsim onaylanana kadar depo, klasör ve tasarım dosyalarında **Veykivo** çalışma adı kullanılabilir.

## 3. Kullanıcılar ve temel senaryolar

### Ziyaretçi

- Hizmetleri ve firmayı inceler.
- Proje örneklerini filtrelemeden liste halinde görür ve detaylarına gider.
- Teknoloji yetkinliklerini ve ekibi inceler.
- Blog yazısı okur; iletişim veya teklif formu gönderir.

### Yönetici

- Güvenli oturum açar ve kapatır.
- Hizmet, proje, ekip, teknoloji ve blog içeriklerini oluşturur, düzenler ve yayından kaldırır.
- Görsel yükler, başlık ve alternatif metin belirler.
- Gelen talepleri listeler, detayını inceler ve durumunu günceller.
- Şirket iletişim ve genel SEO bilgilerini yönetir.

**Yetki ilkesi:** MVP'de herkese açık kullanıcı kaydı yoktur. Başlangıçta yalnızca davetle/kurulumla oluşturulan `Admin` rolü bulunur.

## 4. Site haritası ve sayfa içerikleri

| Sayfa | Önerilen yol | MVP içeriği |
|---|---|---|
| Ana sayfa | `/` | Hero, değer önerisi, hizmetler, seçili projeler, çalışma süreci, CTA |
| Hakkımızda | `/kurumsal/hakkimizda` | Şirket hikâyesi, misyon, vizyon, çalışma yaklaşımı |
| Ekibimiz | `/kurumsal/ekibimiz` | İsim, unvan, fotoğraf, kısa tanıtım, LinkedIn bağlantısı |
| Hizmetler | `/hizmetler` | Hizmet kartları ve teklif yönlendirmesi |
| Hizmet detayı | `/hizmetler/[slug]` | Problem, çözüm, kapsam, süreç, CTA ve SEO |
| Projeler | `/projeler` | Yayınlanan referans projeler ve özetleri |
| Proje detayı | `/projeler/[slug]` | İhtiyaç, çözüm, kullanılan teknolojiler, görseller, sonuçlar |
| Teknolojiler | `/teknolojiler` | Frontend, backend, veritabanı ve altyapı yetkinlikleri |
| Blog | `/blog` | Yayınlanmış yazılar ve sayfalama |
| Blog detayı | `/blog/[slug]` | Makale, tarih, kapak görseli, SEO meta verileri |
| İletişim | `/iletisim` | İletişim bilgileri, talep formu, KVKK yönlendirmesi |
| Gizlilik politikası | `/gizlilik-politikasi` | Onaylanmış gizlilik metni |
| KVKK aydınlatma | `/kvkk` | Onaylanmış aydınlatma metni |

**Üst menü:** Ana Sayfa, Kurumsal, Hizmetlerimiz, Projelerimiz, Teknolojilerimiz, Blog ve vurgulu **Teklif Al** bağlantısı. Teklif Al, ilk sürümde `/iletisim` sayfasındaki form bölümüne gider; ayrı bir teklif sayfası gerektirmez.

**Kurumsal alt menüsü:** Hakkımızda ve Ekibimiz. `/kurumsal` yolu doğrudan Hakkımızda sayfasına yönlendirilebilir.

**Hizmet içerikleri için başlangıç önerisi:** Özel Yazılım Geliştirme, Web Uygulama Geliştirme, Mobil Uygulama Geliştirme, ERP ve CRM Çözümleri, Yapay Zekâ ve Otomasyon, Yazılım Danışmanlığı. Gerçekte sunulmayan hizmetler yayımlanmaz.

## 5. MVP teknoloji yığını

### Frontend

- Next.js App Router, React ve TypeScript.
- Tailwind CSS v4, shadcn/ui ve Lucide React.
- React Hook Form + Zod: iletişim ve yönetim paneli formları.
- TanStack Query + TanStack Table: yönetim paneli listeleme ve veri işlemleri.
- `openapi-typescript` + `openapi-fetch`: ASP.NET API sözleşmesinden tip güvenli istekler.
- `react-markdown`: blog içeriğini basit Markdown formatında görüntüleme.
- Next.js yerleşik metadata, sitemap, robots, görsel ve font optimizasyonu.

### Backend

- C# + ASP.NET Core Web API.
- PostgreSQL + Entity Framework Core + Npgsql.
- ASP.NET Core Identity: yönetici kimlik doğrulaması ve rol kontrolü.
- FluentValidation: sunucu tarafı istek doğrulama.
- OpenAPI + Swagger UI: geliştirme ortamı API belgeleri.
- Serilog: yapılandırılmış uygulama logları.
- S3 uyumlu dosya depolama: proje, blog ve ekip görselleri.
- SMTP veya tek bir e-posta sağlayıcısı: yeni talep bildirimleri.
- xUnit: kritik backend testleri; Playwright: temel uçtan uca testler.

### Dağıtım

- Next.js ve ASP.NET Core için ayrı Docker servisleri.
- PostgreSQL ayrı kalıcı veritabanı servisi.
- Mevcut Hetzner/Dokploy altyapısına uygun dağıtım.
- HTTPS, ortam değişkenleri, veritabanı yedekleme ve canlılık kontrolleri.

**Bilinçli olarak eklenmeyenler:** Redis, Hangfire, RabbitMQ, mikroservis, MongoDB, Elasticsearch, Zustand, hareket/animasyon kütüphaneleri, çoklu dil sistemi, ayrı frontend auth çözümü ve Prisma. Ölçülebilir ihtiyaç oluşursa sonraki sürümde değerlendirilecektir.

## 6. Teknik mimari ve proje yapısı

```text
veykivo/
  web/                       Next.js kurumsal site ve /admin paneli
    src/app/                 App Router sayfaları
    src/components/          Ortak UI bileşenleri
    src/features/            Site ve yönetim paneli modülleri
    src/lib/api/             OpenAPI üzerinden tip güvenli istemci
  api/                       ASP.NET Core çözümü
    Veykivo.Api/             Endpoint, kimlik doğrulama, middleware
    Veykivo.Application/     İş kuralları ve uygulama servisleri
    Veykivo.Domain/          Varlıklar, enumlar, domain kuralları
    Veykivo.Infrastructure/  EF Core, dosya ve e-posta adaptörleri
    Veykivo.Tests/           Backend testleri
  infra/                     Docker ve dağıtım tanımları
  docs/                      API, kurulum ve yayın notları
```

Üst klasör çalışma adı olarak `veykivo` olacaktır. Kod tarafında **tek API uygulaması ve modüler monolit** kullanılır. Başlangıç için fiziksel olarak ayrılmış mikroservisler veya ayrı bir mesaj kuyruğu gerekmez.

### İstek akışı

1. Next.js Server Component, herkese açık içerikleri ASP.NET Core API'den sunucu tarafında alır.
2. Next.js `generateMetadata`, slug bazlı başlık ve açıklamaları üretir.
3. Yönetim paneli oturumunu ASP.NET Core Identity kontrol eder.
4. Yönetici değişiklikleri Web API üzerinden PostgreSQL'e yazılır.
5. Görseller S3 uyumlu depoda tutulur; veritabanında nesne anahtarı, URL ve alt metin saklanır.
6. İletişim formu önce veritabanına kaydedilir; e-posta bildirimi başarısız olursa talep kaydı korunur.

**Kimlik doğrulama kararı:** Ayrı bir Better Auth kurulmaz. Yönetim paneli için mümkünse aynı origin altında `/api` ters proxy ve güvenli `HttpOnly`, `Secure`, uygun `SameSite` cookie kullanılır. CSRF önlemleri, erişim politikaları ve rate limiting backend'de uygulanır.

## 7. Veri modeli

| Tablo / Varlık | Önemli alanlar |
|---|---|
| `Users` | Id, Email, PasswordHash, Role, IsActive, CreatedAt (Identity tabloları temel alınır) |
| `Services` | Id, Slug, Title, Summary, Body, CoverImageId, SortOrder, IsPublished, SeoTitle, SeoDescription |
| `Projects` | Id, Slug, Title, Summary, Challenge, Solution, Outcome, CoverImageId, IsPublished, PublishedAt |
| `Technologies` | Id, Name, Category, Icon, SortOrder, IsPublished |
| `ProjectTechnologies` | ProjectId, TechnologyId |
| `TeamMembers` | Id, Name, RoleTitle, Bio, PhotoId, LinkedInUrl, SortOrder, IsPublished |
| `Posts` | Id, Slug, Title, Excerpt, BodyMarkdown, CoverImageId, Status, PublishedAt, SeoTitle, SeoDescription |
| `MediaAssets` | Id, StorageKey, MimeType, SizeBytes, AltText, CreatedAt |
| `Inquiries` | Id, Name, Email, Company, PhoneOptional, ServiceInterest, Message, Status, CreatedAt |
| `SiteSettings` | Key, Value (iletişim, sosyal bağlantılar, şirket tanıtımı ve SEO varsayılanları) |

Tüm tablolar için uygun indeksler, slug alanlarında benzersizlik, UTC zaman damgaları ve migration geçmişi tutulur. Talep kayıtlarında gereksiz kişisel veri toplanmaz; veri saklama ve silme politikası yayın öncesi belirlenir.

## 8. API kapsamı

### Herkese açık API

| Yöntem | Endpoint | Amaç |
|---|---|---|
| GET | `/api/v1/services` | Yayındaki hizmetleri listele |
| GET | `/api/v1/services/{slug}` | Hizmet detayı |
| GET | `/api/v1/projects` | Yayındaki projeleri listele |
| GET | `/api/v1/projects/{slug}` | Proje detayı |
| GET | `/api/v1/team` | Yayındaki ekip üyeleri |
| GET | `/api/v1/technologies` | Teknoloji listesini getir |
| GET | `/api/v1/posts` | Yayındaki blog yazıları; sayfalama |
| GET | `/api/v1/posts/{slug}` | Blog detayı |
| GET | `/api/v1/site-settings/public` | Herkese açık şirket bilgileri |
| POST | `/api/v1/inquiries` | İletişim / teklif talebi oluştur |

### Yönetim API

- `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.
- `/api/v1/admin/services`, `/projects`, `/team`, `/technologies`, `/posts` altında yetkili CRUD işlemleri.
- `POST /api/v1/admin/media` ile doğrulanmış dosya yükleme.
- `GET /api/v1/admin/inquiries` ve `PATCH /api/v1/admin/inquiries/{id}`.
- `GET/PUT /api/v1/admin/site-settings`.

Tüm admin uç noktaları kimlik doğrulaması ve rol yetkisi gerektirir. Public API yalnızca yayınlanan içerikleri döndürür; taslak içerikleri döndürmez. API hataları tutarlı problem ayrıntısı biçiminde sunulur.

## 9. Yönetim paneli ekranları

1. **Giriş:** E-posta, parola, güvenli oturum açma ve hata mesajları.
2. **Genel bakış:** Toplam içerik ve okunmamış teklif talepleri.
3. **Hizmet yönetimi:** Liste, yeni hizmet, düzenle, taslak/yayın durumu.
4. **Proje yönetimi:** Proje açıklamaları, teknoloji ilişkileri ve görseller.
5. **Ekip yönetimi:** Kişi bilgileri, fotoğraf ve sıralama.
6. **Teknoloji yönetimi:** Ad, kategori ve sıralama.
7. **Blog yönetimi:** Markdown editörü, kapak görseli, önizleme ve yayın durumu.
8. **Talepler:** Liste, detay, yeni/işlemde/tamamlandı durumları.
9. **Site ayarları:** İletişim, sosyal medya, SEO varsayılanları.

MVP'de çok aşamalı onay akışları, ayrıntılı rol matrisi, çok kullanıcılı editör yetkisi ve analitik dashboard bulunmaz.

## 10. Güvenlik, kalite ve SEO

### Güvenlik

- HTTPS zorunlu; parolalar Identity altyapısında güvenli şekilde saklanır.
- Yönetim API'sinde yetki kontrolü ve giriş denemesi sınırlaması.
- İletişim formunda sunucu tarafı validasyon, rate limiting ve botlara karşı basit honeypot.
- CSRF koruması; cookie tabanlı yönetim işlemlerinde zorunlu.
- Dosya yüklemede tür, boyut, uzantı ve içerik kontrolü; rastgele dosya adı.
- Gizli anahtarlar depoya yazılmaz; ortam değişkenleriyle yönetilir.
- Loglara şifre, token veya form mesajının tamamı dökülmez.

### SEO ve erişilebilirlik

- Her public sayfaya benzersiz title ve description; slug detay sayfalarına dinamik metadata.
- Canonical URL, Open Graph, robots.txt, sitemap.xml ve uygun JSON-LD.
- Blog ve proje sayfalarında 404 durumunun doğru üretilmesi; silinen/taslak içeriklerin indekslenmemesi.
- Anlamlı başlık hiyerarşisi, klavye kullanımı, form etiketleri, fotoğraflarda alt metin.
- Mobil/masaüstü responsive tasarım; temel performans kontrolü.

### Testler

- API: yetki kontrolü, CRUD, slug benzersizliği, taslak görünürlüğü, form doğrulama.
- Uçtan uca: ana sayfa açılışı, hizmet/proje/blog detayı, teklif gönderimi, admin giriş ve içerik yayını.
- Yayın öncesi: gerçek cihaz boyutları, 404/500 sayfaları, SEO dosyaları, yedek geri yükleme örneği.

## 11. Uygulama aşamaları

| Aşama | İşler | Çıkış kriteri |
|---|---|---|
| 1. Temel kurulum | Repo, Next.js, ASP.NET Core, PostgreSQL, EF migrations, auth, tasarım sistemi | Çalışan yerel ortam ve korumalı admin girişi |
| 2. İçerik altyapısı | Hizmet, proje, ekip, teknoloji, medya ve blog CRUD; OpenAPI istemcisi | Yönetim panelinden içerik yayınlanabilir |
| 3. Public sayfalar | Tüm sayfalar, dinamik detaylar, SEO, responsive arayüz | Public site gerçek API verilerini gösterir |
| 4. Teklif ve yayın | Form, bildirim, güvenlik, testler, performans, Docker, yedekleme | Üretim kabul listesi tamamlanır |

Aşamalar sıralıdır; tasarım ve örnek içerik hazırlığı paralel ilerleyebilir. Süre, onaylanmış tasarım, içerik teslimi ve geliştirici kapasitesine göre ayrıca tahmin edilmelidir.

## 12. MVP kabul kriterleri

- [ ] Tüm public rotalar ve mobil menü çalışıyor.
- [ ] Hizmet, proje, teknoloji, ekip ve blog içerikleri yönetim panelinden güncellenebiliyor.
- [ ] Taslaklar ve yayından kaldırılan içerikler public API'de görünmüyor.
- [ ] Her detay sayfasında benzersiz slug ve SEO metadata bulunuyor.
- [ ] Teklif formu veriyi kaydediyor; başarılı/başarısız durumları kullanıcıya açıklıyor.
- [ ] Yönetim sayfalarına oturum olmadan erişilemiyor.
- [ ] Dosya yükleme sınırlamaları, rate limit ve CSRF kontrolleri doğrulandı.
- [ ] Sitemap, robots, Open Graph, favicon, 404 ve 500 senaryoları test edildi.
- [ ] Temel otomatik testler ve prod build başarılı.
- [ ] HTTPS, üretim gizli değişkenleri, sağlık kontrolü ve veritabanı yedeği hazır.
- [ ] Gerçek içerikler, referans kullanımı izinleri ve yasal metinler yayın öncesi onaylandı.

## 13. MVP dışında kalanlar

- Çoklu dil (TR/EN), çoklu şirket/tenant yapısı ve müşteri portalı.
- Kariyer başvuru sistemi, iş ortakları portalı ve ayrıntılı müşteri yorumları.
- Gelişmiş arama, gelişmiş filtreleme ve içerik onay iş akışları.
- Redis, Hangfire, RabbitMQ, Elasticsearch ve mikroservislere geçiş.
- Online ödeme, abonelik, mobil uygulama ve canlı destek.
- Yapay zekâ içerik üretimi, öneri sistemi ve analitik gösterge panelleri.

Bu ihtiyaçlar ortaya çıkarsa ikinci fazda ayrı önceliklendirme yapılır.

## 14. Açık kararlar ve ilk görevler

**Geliştirme başlamadan önce karara bağlanacaklar:**

1. Veykivo adının marka ve domain açısından uygunluğu.
2. Gerçek şirket adı, logo, renkler, iletişim bilgileri, hedef müşteri tipi.
3. Başlangıçta yayınlanacak gerçek hizmet, proje ve ekip içerikleri.
4. S3 depolama ve e-posta sağlayıcısı seçimi.
5. KVKK/gizlilik metinlerinin şirket tarafından onaylanması.

**İlk geliştirme görevi:** Repo ve solution yapısını açmak, PostgreSQL bağlantısını kurmak, Identity ile tek admin hesabını hazırlamak, ilk EF migration'ını oluşturmak ve Next.js'ten OpenAPI tipleriyle çalışan örnek bir `GET /api/v1/services` isteğini uçtan uca doğrulamak.

---

**Doküman notu:** Bu belge bir MVP uygulama planıdır. İşlevler ve teknoloji kararları ilk sürüm içindir; gerçek hizmet iddiaları, hukuki metinler ve marka kullanım hakkı ayrıca doğrulanmalıdır.
