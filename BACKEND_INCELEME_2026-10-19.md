**Veykivo backend incelemesi — 19 Ekim 2026**

Mevcut yapı MVP için anlaşılır ve makul bir katmanlı monolit. Teknoloji seçimleri ihtiyaca uygun. Bununla birlikte, oturum iptali ve proxy güveniyle ilgili doğrulanmış güvenlik sorunları var. İçerik çıktısında XSS, dosya işlemlerinde tutarlılık ve düzenleme işlemlerinde veri kaybı da giderilmeden üretim kabulü vermem.

İnceleme backend kaynaklarını, proje bağımlılıklarını, migration/model tanımlarını, Docker yapılandırmasını ve backend verisini tüketen ilgili frontend sınırlarını kapsıyor. Context7 MCP üzerinden resmi ASP.NET Core ve EF Core belgeleri sorgulandı. Uygulama kaynakları değiştirilmedi; bu rapor eklendi. Çalışan yerel API üzerinde yalnızca okuma ve kayıt oluşturmayan geçersiz istekler kullanıldı. Yazma gerektiren kontroller, kaynakların kopyasında ve ayrı, geçici PostgreSQL ortamında yapıldı; inceleme container'ları ve ağı kaldırıldı.

**Kullanılan teknolojiler**

| Alan | Kodda bulunan teknoloji |
| --- | --- |
| Platform | C#, .NET 10, ASP.NET Core Minimal API |
| Veritabanı | PostgreSQL; çalışan yerel imaj PostgreSQL 17 |
| ORM | EF Core 10.0.13, Npgsql.EntityFrameworkCore.PostgreSQL 10.0.3 |
| Kimlik ve yetki | ASP.NET Core Identity, cookie oturumu, Admin rolü |
| Doğrulama | FluentValidation 12.2.0, endpoint filtreleri |
| API sözleşmesi | Microsoft.AspNetCore.OpenApi 10.0.13, Swagger UI 10.3.0 |
| Loglama | Serilog.AspNetCore 10.0.0 |
| Medya / bildirim | Yerel dosya sistemi adaptörü, System.Net.Mail ile SMTP |
| Çalıştırma | Docker; API önünde Next.js üzerinden aynı origin altında proxy |
| Test altyapısı | xUnit 2.9.3, WebApplicationFactory, EF Core InMemory; mevcut projede test kaynakları yok |

**1. Yüksek — İstemcinin belirlediği IP adresi istek sınırını aşabiliyor**

Kaynak: [Program.cs:94](C:/Users/musay/Projects/veykivo/backend/Veykivo.Api/Program.cs:94), [docker-compose.yml:14](C:/Users/musay/Projects/veykivo/docker-compose.yml:14).

`TrustAllProxies=true` olduğunda bilinen proxy ve ağ listeleri temizleniyor. Login ve iletişim formu limitleri ise `RemoteIpAddress` üzerinden hesaplanıyor. Çalışan geliştirme yapılandırmasında doğrudan gönderilen `X-Forwarded-For`, bu değeri belirleyebiliyor.

Doğrulama: Aynı sahte IP ile `/api/v1/inquiries` adresine gönderilen boş JSON gövdelerinin ilk beşi 400, altıncısı 429 döndü. Yalnızca başlıktaki IP değiştirildiğinde sonraki istek yeniden 400 döndü ve limit uygulanmadı. Gövdeler geçersiz olduğu için talep kaydı oluşturulmadı.

Etki: İletişim formu spam sınırı ve login için IP kotası aşılabilir. Identity'nin hesap başına başarısız giriş kilidi ayrıca mevcut; bu test onun aşıldığını göstermiyor. API şu anda loopback üzerinde yayınlanıyor ve Compose açıkça geliştirme için yazılmış; internetteki üretim erişilebilirliği hakkında bir iddia yok.

Öneri: Gerçek proxy IP/ağlarını açıkça tanımlayın; dış sınırdaki proxy, istemciden gelen forwarding başlıklarını temizleyip güvenilir değerlerle yeniden yazsın. Yalnızca güven listesini daraltmak, güvenilir proxy sahte başlığı olduğu gibi geçiriyorsa yeterli olmaz. Proxy sayısı ile `ForwardLimit` uyumlu olmalı. [Microsoft proxy belgesi](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-10.0).

**2. Yüksek — Pasife alınan yönetici mevcut oturumuyla işlem yapabiliyor**

Kaynak: [AuthEndpoints.cs:50](C:/Users/musay/Projects/veykivo/backend/Veykivo.Api/Endpoints/AuthEndpoints.cs:50), [AuthEndpoints.cs:67](C:/Users/musay/Projects/veykivo/backend/Veykivo.Api/Endpoints/AuthEndpoints.cs:67), [Program.cs:67](C:/Users/musay/Projects/veykivo/backend/Veykivo.Api/Program.cs:67).

`IsActive` login ve `/auth/me` içinde kontrol ediliyor. Admin politikası yalnızca oturum ve rol istiyor. Cookie doğrulaması, özel `IsActive` alanını kontrol etmiyor; `/me` tarafından 401 dönülmesi de cookie'yi iptal etmiyor.

Doğrulama: Ayrı veritabanında yönetici oluşturup giriş yaptım, ardından `UserManager.UpdateAsync` ile `IsActive=false` yaptım. Aynı cookie ile `/auth/me` 401 dönerken `/admin/dashboard` 200 döndü; `/admin/technologies` üzerinden yeni kayıt oluşturma 201 ile başarılı oldu.

Etki: Hesabı pasife almak, erişimi kesmek için yeterli değil. Sliding expiration bu pencerenin yalnızca sekiz saatle sınırlı kabul edilmesini de engelliyor.

Öneri: Aktif hesap koşulunu yetkilendirme veya cookie principal doğrulamasında uygulayın. Pasife alma işleminde security stamp yenilenmeli; kontrol aralığı beklenen iptal süresine göre belirlenmeli. Özel cookie event eklenirken Identity'nin mevcut security stamp doğrulaması korunmalı. [Microsoft cookie doğrulama belgesi](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/cookie?view=aspnetcore-10.0#react-to-back-end-changes), [Identity security stamp açıklaması](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-configuration?view=aspnetcore-10.0).

**3. Orta — Backend içeriği JSON-LD çıktısından kalıcı XSS üretebiliyor**

Kaynak: [Ana sayfa:49](C:/Users/musay/Projects/veykivo/frontend/src/app/(site)/page.tsx:49), [hizmet detayı:63](C:/Users/musay/Projects/veykivo/frontend/src/app/(site)/hizmetler/[slug]/page.tsx:63), [blog detayı:66](C:/Users/musay/Projects/veykivo/frontend/src/app/(site)/blog/[slug]/page.tsx:66).

İlgili sayfalar backend'den gelen başlık, açıklama veya şirket ayarlarını `JSON.stringify` ile doğrudan `dangerouslySetInnerHTML` içine veriyor. JSON serileştirmesi HTML bağlamı için kaçış sağlamıyor.

Doğrulama: Projedeki React/ReactDOM sürümüyle aynı render işlemini çalıştırdım. `</script><img src=x onerror=alert(1)>` içeren örnek başlık, script etiketini kapatıp HTML içinde yeni bir `img` etiketi üretti. Örnek, başlık uzunluk sınırlarına sığıyor. Mevcut içeriğe bu veri yazılmadı ve tarayıcıda kod çalıştırılmadı; HTML'den çıkış render seviyesinde doğrulandı.

Ön koşul: İlgili içerik veya ayar alanını yazma yetkisi gerekiyor. Anonim iletişim formundan bu çıktıya bir veri akışı bulunmadı. Bu nedenle anonim ziyaretçinin doğrudan kullanabildiği bir açık olarak sınıflandırılmadı.

Öneri: JSON-LD için ortak bir serileştirme fonksiyonu kullanın; örneğin `JSON.stringify(value).replace(/</g, '\\u003c')`. Doğru düzeltme HTML çıktısının üretildiği sınırda yapılmalı. CSP ek koruma sağlayabilir. [Next.js resmi JSON-LD güvenlik açıklaması](https://nextjs.org/docs/app/guides/json-ld).

**4. Orta — Bazı yazma yollarında doğrulama eksik; hatalı veri 500 üretiyor**

Kaynak: [AdminEndpoints.cs:132](C:/Users/musay/Projects/veykivo/backend/Veykivo.Api/Endpoints/AdminEndpoints.cs:132), [Validators.cs:120](C:/Users/musay/Projects/veykivo/backend/Veykivo.Application/Validation/Validators.cs:120), [MediaService.cs:64](C:/Users/musay/Projects/veykivo/backend/Veykivo.Application/Services/MediaService.cs:64), [SiteSettingsService.cs:21](C:/Users/musay/Projects/veykivo/backend/Veykivo.Application/Services/SiteSettingsService.cs:21).

Upload sırasında alınan `altText`, güncelleme DTO'sunun 300 karakter kontrolünden geçmiyor. Güncellemede ise yalnızca `MaximumLength` kullanıldığı için `null` kabul edilip daha sonra `Trim()` çağrısında hata oluşuyor. Benzer biçimde site ayarları, JSON'dan gelebilen null değer üzerinde doğrudan `Length` çağırıyor.

Doğrulama: Ayrı PostgreSQL ortamında 301 karakter alt metinle görsel yükleme 500 döndü; PostgreSQL uzunluk sınırı hatası oluştu. Var olan görsele `{"altText":null}` gönderilmesi de 500 ve `NullReferenceException` üretti.

Öneri: Upload ve güncelleme için ortak alan kuralları uygulayın. Gerekli alanlarda `NotNull`, isteğe bağlı alanlarda açık bir null normalizasyonu kullanın. C# nullable bildirimi HTTP isteği için runtime doğrulama yerine geçmiyor. Site ayarlarının e-posta/URL gibi anlamına göre de doğrulanması yararlı olur.

**5. Orta — Dosya sistemi ile veritabanı işlemleri tutarlı tamamlanmıyor**

Kaynak: [MediaService.cs:47](C:/Users/musay/Projects/veykivo/backend/Veykivo.Application/Services/MediaService.cs:47), [MediaService.cs:78](C:/Users/musay/Projects/veykivo/backend/Veykivo.Application/Services/MediaService.cs:78).

Upload önce dosyayı yazıyor, sonra veritabanı kaydını oluşturuyor. İkinci adım başarısız olursa dosya temizlenmiyor. Silmede ise önce veritabanı kaydı kaldırılıyor; ardından dosya silme başarısız olursa yeniden deneme için kalıcı bir iş kaydı kalmıyor.

Doğrulama: Yukarıdaki uzun alt metin testi sonunda veritabanında sıfır medya kaydı varken upload klasöründe bir dosya kaldı. Başarısız upload'ın geride dosya bırakması doğrudan doğrulandı; silme hatası senaryosu kaynak incelemesine dayanıyor.

Öneri: Upload başarısızlığında yazılan dosyayı telafi işlemiyle temizleyin; kısmi dosya yazımını da kapsayın. Silme için kalıcı silme işi/yeniden deneme veya uzlaştırma mekanizması kullanın. Tek başına EF transaction, dosya sistemi işlemini atomik hale getirmez.

**6. Orta — Eski düzenleme yeni içeriği sessizce ezebiliyor**

Kaynak: [AdminContentService.cs:78](C:/Users/musay/Projects/veykivo/backend/Veykivo.Application/Services/AdminContentService.cs:78), [AdminContracts.cs:24](C:/Users/musay/Projects/veykivo/backend/Veykivo.Application/Contracts/AdminContracts.cs:24), [AppDbContext.cs:46](C:/Users/musay/Projects/veykivo/backend/Veykivo.Infrastructure/Persistence/AppDbContext.cs:46).

İçerik güncellemelerinde istemcinin okuduğu sürümü taşıyan bir alan veya ETag koşulu yok. İçerik varlıklarında optimistic concurrency token da tanımlanmamış. Identity tablolarındaki concurrency alanları içerik tablolarını korumuyor.

Doğrulama: İki editörün aynı ilk veriyi okuduğu senaryoda ilk PUT başlığı değiştirdi. Eski veriye dayanan ikinci PUT yalnızca açıklama değişikliği amacıyla gönderildiğinde iki istek de 200 döndü; ilk başlık değişikliği eski başlıkla ezildi. Aynı durum tek yöneticinin iki sekmesinde de oluşabilir.

Öneri: Okuma yanıtına sürüm/ETag ekleyin; güncellemede beklenen sürümü zorunlu tutun ve uyuşmazlığı 409/412 ile bildirin. EF concurrency kontrolünü bu istemci sürümüyle ilişkilendirin. Sadece her güncelleme isteğinde veritabanından yeni sürümü okuyup token tanımlamak, eski form verisini yakalamaya yetmez. [EF Core concurrency belgesi](https://learn.microsoft.com/en-us/ef/core/saving/concurrency).

**7. Düşük — Sayfalama sınır değeri anonim istekte 500 üretiyor**

Kaynak: [PublicContentService.cs:92](C:/Users/musay/Projects/veykivo/backend/Veykivo.Application/Services/PublicContentService.cs:92), [InquiryService.cs:88](C:/Users/musay/Projects/veykivo/backend/Veykivo.Application/Services/InquiryService.cs:88).

Sayfa numarasının yalnızca alt sınırı kontrol ediliyor. `(page - 1) * pageSize` int taşmasıyla negatif OFFSET üretebiliyor.

Doğrulama: Çalışan yerel API'de `GET /api/v1/posts?page=2147483647&pageSize=50` 500 döndü. Bu test veri değiştirmedi.

Öneri: Sayfa/offset için makul üst sınır koyun ve çarpımı taşmaya karşı kontrol edin. Geçersiz aralık için 400 dönün. Bu bulgu tek başına doğrulanmış bir hizmet engelleme saldırısı olarak değerlendirilmedi.

**8. Düşük / sağlamlaştırma — Depolama yol kontrolü kardeş klasöre çıkışı kabul ediyor**

Kaynak: [LocalFileStorage.cs:47](C:/Users/musay/Projects/veykivo/backend/Veykivo.Infrastructure/Storage/LocalFileStorage.cs:47).

`full.StartsWith(root)` klasör sınırını doğrulamıyor. `/tmp/uploads-backup`, `/tmp/uploads` ile başladığı için `../uploads-backup/...` yolu kabul edilebiliyor.

Doğrulama: Geçici klasörde oluşturulan sentetik dosya, gerçek `LocalFileStorage.DeleteAsync` çağrısına verilen kardeş klasör yolu ile silinebildi.

Erişilebilirlik sınırı: Mevcut API, kullanıcıya doğrudan `StorageKey` gönderme olanağı vermiyor; normal upload anahtarları sunucuda üretiliyor. Bu nedenle mevcut endpoint'lerden kullanılabilen keyfi dosya silme açığı doğrulanmış değil. Adaptörün güvenlik sınırı yine de yanlış.

Öneri: Normalize edilmiş kökü klasör ayırıcıyla sınırlandırın veya `Path.GetRelativePath` üzerinden kök dışına çıkan yolları reddedin. İşletim sistemine uygun yol karşılaştırması kullanın.

**Mimari değerlendirme**

Bağımlılık yönü genel olarak doğru: Domain dış katmanlara bağlı değil; Application Domain'e, Infrastructure uygulama soyutlamalarına, API ise uygulama servisleri ve başlangıç yapılandırmasına dayanıyor. Depolama ve e-posta adaptörleri arayüzlerle ayrılmış. Endpoint'ler ağırlıkla ince; veritabanı sorguları uygulama servislerinde. DTO'larla entity ayrımı var.

Bu, Clean Architecture yaklaşımına yakın, pragmatik bir katmanlı monolit. `IAppDbContext` içinde `DbSet` bulunması ve Application'ın EF Core sorgu uzantılarını kullanması nedeniyle uygulama katmanı persistence teknolojisinden tamamen bağımsız değil. Küçük bir CMS için bu bilinçli ve kabul edilebilir bir tercih; tek başına mimari hata saymıyorum. Generic repository veya MediatR eklemek mevcut güvenlik ve tutarlılık sorunlarını çözmez.

Bakım açısından iyileştirilmesi gereken noktalar:

- [AdminContentService.cs:11](C:/Users/musay/Projects/veykivo/backend/Veykivo.Application/Services/AdminContentService.cs:11), beş içerik türü ile dashboard işlemlerini topluyor. Şimdilik okunabilir; büyümeden önce Services, Projects, Posts, Team ve Technologies sorumlulukları ayrılmalı. Yeni bir sınıf/arayüz katmanı oluşturmak yerine değişme nedenlerine göre ayrım yapılmalı.
- Doğrulama ağırlıkla HTTP filtresinde. Gelecekte bir servis arka plan işinden çağrılırsa aynı kuralların atlanmaması için zorunlu iş kuralları kullanım senaryosunda da güvenceye alınmalı.
- [Project.cs:31](C:/Users/musay/Projects/veykivo/backend/Veykivo.Domain/Entities/Project.cs:31) yayınlama zamanını doğrudan sistem saatinden alıyor; servislerde ise `TimeProvider` kullanılıyor. Domain işlemine zaman parametresi geçirmek testleri ve zaman davranışını tutarlı kılar.
- [InquiryService.cs:46](C:/Users/musay/Projects/veykivo/backend/Veykivo.Application/Services/InquiryService.cs:46), bildirimi HTTP isteği içinde bekliyor; geçici SMTP hatasından sonra kalıcı yeniden deneme yok. Kaydın önce saklanması doğru. Teslimat güvencesi gerektiğinde outbox ve küçük bir arka plan çalışanı yeterli olabilir; ayrı broker zorunlu değil.
- Yönetim listeleri bazı içeriklerde bütün gövdeleri getiriyor. Örneğin blog listesi tüm Markdown gövdelerini taşıyor. Veri büyüdüğünde sayfalı, listeye özel DTO ve projection kullanılmalı. Public projelerde de limit parametresi verilmediğinde sorgu sınırsız.
- Slug/name için uygulama ön kontrolü ile unique indeks birlikte kullanılıyor; bu doğru. Fakat eşzamanlı insert yarışında indeks ihlali özel 409 eşlemesine girmeyip genel 500'e düşebilir. Bu senaryo ayrıca dinamik olarak sınanmadı.

**Doğru yapılmış noktalar**

- Admin route grubunda merkezi rol zorunluluğu var. Oturumsuz yönetim isteğinin 401 döndüğü doğrulandı.
- Cookie HttpOnly ve SameSite=Strict; production için Secure varsayılanı açık. Yönetim ve auth yazma işlemlerinde CSRF filtresi var. Oturumlu fakat tokensız ayar güncellemesinin 400 ile reddedildiği doğrulandı.
- Upload'daki `DisableAntiforgery`, grup üzerindeki özel CSRF filtresini kaldırmıyor; bu satır tek başına CSRF açığı değil.
- Parola doğrulama Identity'ye bırakılmış; hesap kilitleme tanımlı. İncelenen kaynaklarda özel parola hashleme veya plaintext parola saklama kodu yok.
- Public sorgular yayın durumunu süzüyor; blogda ileri tarihli içerik de filtreleniyor. Public ayarlar açık anahtar listesiyle sınırlandırılmış.
- İncelenen veri sorguları EF LINQ kullanıyor; kullanıcı girdisi birleştirilmiş ham SQL görülmedi.
- Slug ve depolama anahtarlarında unique indeksler, ilişkilerde foreign key kuralları var. Okuma sorgularında `AsNoTracking` ve birçok public sorguda projection kullanılmış.
- Upload'da uzantı, bildirilen MIME, boyut ve dosya başlığı kontrol ediliyor; isimler sunucuda rastgele üretiliyor. Dosya başlığı kontrolü tam görsel decode doğrulaması anlamına gelmiyor; boyut/piksel sınırı ve gerekirse yeniden kodlama ayrıca değerlendirilebilir.
- 500 yanıtında istisna içeriği kullanıcıya verilmemiş. Docker API imajı root yerine `app` kullanıcısıyla çalışıyor; data protection anahtarları için kalıcı yol tanımlanmış.

**Test ve üretime hazırlık**

Kaynak projede test paketi referansları bulunuyor fakat gerçek test kaynakları yok. Temiz derlemeden sonra `dotnet test`, `No test is available` bildirdi. Bu, başarılı bir güvenlik/işlev testi sonucu değildir. Proje planında beklenen yetki, CRUD, slug benzersizliği, taslak görünürlüğü ve form testleri henüz kodda bulunmuyor.

Bu inceleme için kaynak kopyasında yazılan altı kontrolün tamamı çalıştı: beşi yukarıdaki kusurları tekrar üretti; biri oturum ve CSRF korumasının beklendiği gibi çalıştığını doğruladı. Reprodüksiyon testlerinin geçmesi, uygulamanın güvenli olduğu anlamına gelmez; hatalı davranışın mevcut olduğunu doğrular. [Geçici kontrol kaynakları](C:/Users/musay/AppData/Local/Temp/veykivo-audit-5aedef054070416daeb1b84a57c53c0e/ReviewChecks.cs), [geçici çalışma çıktısı](C:/Users/musay/AppData/Local/Temp/veykivo-audit-5aedef054070416daeb1b84a57c53c0e/test-results.log).

Mevcut Compose geliştirme amaçlı: Development ortamı, HTTP için Secure cookie zorunluluğunun kaldırılması, tüm proxy'lere güven ve otomatik migration içeriyor. Bunlar yerel geliştirme bağlamında değerlendirildi. Üretim yapılandırması ayrıca Production ortamını, TLS sınırını, güvenilir proxy'leri, doğru cookie politikasını ve örnek içerik seed'inin kapatılmasını açıkça belirlemeli. Üretimde migration için ayrı adım ve kısıtlı uygulama veritabanı yetkisi tercih edilmeli. Dış TLS/proxy ve gerçek yedekleme düzeni bu çalışma alanından doğrulanmadı.

**Yapılan doğrulamalar**

| Kontrol | Sonuç |
| --- | --- |
| İzole .NET SDK ile Release build | Başarılı; 0 uyarı, 0 hata |
| Mevcut test projesi | Test bulunamadı |
| Doğrudan ve dolaylı NuGet bağımlılık taraması | api.nuget.org kaynağına göre beş projede de bilinen zafiyet raporlanmadı |
| Ayrı PostgreSQL üzerinde reprodüksiyon kontrolleri | 6/6 çalıştı; mevcut kusurları ve iki temel korumayı doğruladı |
| Yerel API / anonim admin erişimi | 401 |
| Yerel API / tokensız login | 400 |
| Yerel API / sahte IP ile limitin değiştirilmesi | Tekrar üretildi |
| Yerel API / sayfalama taşması | 500 ile tekrar üretildi |
| React render / JSON-LD HTML'den çıkış | Tekrar üretildi |

NuGet sonucu paket metaverisindeki bilinen açıklarla sınırlı. İş mantığı açıklarını, container işletim sistemi açıklarını veya üretim altyapısını kapsamaz. Paket taramasının temiz olması, yukarıdaki kod kusurlarını ortadan kaldırmıyor.

Önce aktif hesap kontrolü ve proxy güven sınırı, ardından JSON-LD çıktısı, girdi doğrulama, dosya telafisi ve sürümlü güncelleme düzeltilmeli. Bu senaryolar kalıcı regresyon testlerine dönüştürülmeli. Mevcut temeli yeniden yazmaya ihtiyaç görmüyorum; odaklı düzeltmeler ve gerçek testlerle olgunlaştırılabilir.
