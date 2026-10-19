# Veykivo — Kurumsal web sitesi ve yönetim paneli (MVP)

Plan: [`Veykivo_MVP_Proje_Plani.md`](Veykivo_MVP_Proje_Plani.md)

```text
veykivo/
  backend/     ASP.NET Core 10 Web API (modüler monolit)
    Veykivo.Api/             Minimal API endpoint'leri, kimlik, CSRF, rate limit, OpenAPI
    Veykivo.Application/     Servisler, DTO'lar, FluentValidation kuralları
    Veykivo.Domain/          Varlıklar ve enum'lar
    Veykivo.Infrastructure/  EF Core + Npgsql, Identity, dosya depolama, SMTP, seed
    Veykivo.Tests/           xUnit (birim + WebApplicationFactory entegrasyon)
  frontend/    Next.js 16 (App Router, Cache Components) — public site + /admin paneli
  docker-compose.yml         API (ve isteğe bağlı web) servisleri; mevcut global Postgres ağına bağlanır
```

## Yerel geliştirme

Ön koşullar: Docker, Node 20.9+. Makinede .NET SDK olmasa da backend Docker içinde derlenir.

1. Veritabanı: mevcut `postgres` container'ında `veykivo` veritabanı oluşturuldu. Bağlantı bilgisi kök dizindeki `.env` dosyasında (depoya eklenmez, örnek: `.env.example`).
2. API: `docker compose up -d --build api` → http://localhost:5080
   - Açılışta migration'lar uygulanır ve boş tablolara örnek içerik eklenir.
   - Swagger UI: http://localhost:5080/swagger
3. Frontend: `cd frontend && npm install && npm run dev` → http://localhost:3000
4. Panel: http://localhost:3000/admin. Geliştirme hesabı `.env` dosyasındaki `ADMIN_EMAIL` ve `ADMIN_PASSWORD` değerleridir.

Tam yığını container olarak çalıştırmak için: `docker compose --profile full up -d --build`.

### Sık kullanılan komutlar

```bash
# Backend testleri (yerel SDK gerekmez)
docker run --rm -v "$PWD/backend:/src" -v veykivo-nuget:/root/.nuget/packages -w /src \
  mcr.microsoft.com/dotnet/sdk:10.0 dotnet test Veykivo.Tests

# Yeni migration
docker run --rm -v "$PWD/backend:/src" -v veykivo-nuget:/root/.nuget/packages -v veykivo-dotnet-tools:/root/.dotnet/tools \
  -w /src mcr.microsoft.com/dotnet/sdk:10.0 bash -c 'export PATH="$PATH:/root/.dotnet/tools"; \
  (dotnet ef --version || dotnet tool install -g dotnet-ef) && \
  dotnet ef migrations add <Ad> -p Veykivo.Infrastructure -s Veykivo.Api -o Persistence/Migrations'

# API sözleşmesi değişince frontend tiplerini yeniden üret (API çalışırken)
cd frontend && npx openapi-typescript http://127.0.0.1:5080/openapi/v1.json -o src/lib/api/schema.d.ts
```

## Mimari kararlar

- **Aynı origin:** Tarayıcı API'ye Next.js rewrite'ı (`/api/v1/*`, `/uploads/*`) üzerinden erişir. Oturum ASP.NET Core Identity'nin HttpOnly ve `SameSite=Strict` cookie'sinde taşınır, ayrı bir frontend auth çözümü yoktur.
- **CSRF:** Durum değiştiren tüm admin ve giriş isteklerinde `X-CSRF-TOKEN` zorunludur. Token `GET /api/v1/auth/csrf` ile alınır ve oturum değişince yenilenir.
- **Önbellek:** Public içerik `use cache` + `cacheTag` ile önbelleğe alınır (`cacheLife("minutes")`). Panelde kayıt yapılınca Server Action önce oturumu API'de doğrular, sonra `updateTag` ile ilgili etiketi hemen geçersiz kılar.
- **API'ye ulaşılamazsa** sayfalar çökmez, boş içerik gösterilir ve bir dakika sonra yeniden denenir. Docker build sırasında API olmadığı için sayfalar boş üretilir ve çalışırken dolar.
- **Bilinmeyen slug'lar** (ör. `/hizmetler/olmayan`) streaming nedeniyle 200 + `noindex` ile 404 içeriği döndürür (Next 16 Partial Prerender davranışı). Bilinmeyen rotalar ise gerçek 404 döner.
- **Görseller:** MVP'de yerel disk (`IFileStorage` → `LocalFileStorage`, Docker volume). Uzantı, MIME ve dosya imzası doğrulanır, dosya adları rastgeledir. S3 adaptörü aynı arayüzle eklenecek.
- **Animasyon:** Plandaki "animasyon kütüphanesi yok" kararına uyuldu. Tüm hareketler CSS ve IntersectionObserver ile yapıldı, `prefers-reduced-motion` desteklenir.

## Tasarım dili

- **Renkler:** Petrol mavisi `#0E2A2F`, kireç zemin `#F2F5F4`, birincil eylem rengi sodyum amber `#F2B134` (üzerinde her zaman koyu metin).
- **Font:** Tek aile, Schibsted Grotesk (Türkçe karakter destekli).
- **İmza öğeler:** Teknik çizimden gelen kesik köşe (`.notch`) ve blueprint ızgarası. Ana sayfadaki canlı sistem şemasında modüller arasında veri paketleri akar ve iş olayları günlüğe düşer.
- **Görseller:** `frontend/public/images/` altındaki görseller yer tutucudur (picsum.photos). Aynı dosya adlarıyla değiştirilebilir ya da panelden yeni görsel yüklenip içeriğe atanabilir.

## Yayın öncesi açık işler

- Marka/alan adı kontrolü, gerçek içerikler, referans izinleri, KVKK ve gizlilik metinlerinin onayı. Yasal sayfalar taslak uyarısı taşıyor.
- SMTP sağlayıcısı (`Smtp__*` ortam değişkenleri) ve bildirim e-postası (panel → Site ayarları).
- S3 uyumlu depolama adaptörü, veritabanı yedekleme, Playwright uçtan uca testleri.
- Üretimde `Security:SecureCookies=true` (varsayılan), HTTPS ters proxy ve `ForwardedHeaders` için güvenilir ağ ayarı.
