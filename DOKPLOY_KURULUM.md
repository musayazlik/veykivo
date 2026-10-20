# Veykivo Dokploy kurulumu

Bu yapılandırma, tek Docker Compose uygulamasında Next.js (`web`), ASP.NET Core (`api`) ve PostgreSQL (`postgres`) çalıştırır. Mevcut `frontend/Dockerfile` ve `backend/Dockerfile` dosyalarını kullanır.

```text
HTTPS alan adı → Dokploy / Traefik → web:3000 → api:8080 → postgres:5432
```

## 1. Depoyu bağlayın

1. Bu dosyaları ve yayınlayacağınız kodları GitHub deposuna gönderin. Gerçek parolaları Git'e eklemeyin.
2. Dokploy'da Veykivo projesini ve üretim ortamını açın.
3. **Docker Compose** türünde bir servis oluşturun; **Stack** seçmeyin.
4. GitHub deposunu ve yayınlanacak branch'i seçin.
5. Compose dosyası yolunu `./docker-compose.dokploy.yml` yapın. Çalışma dizini depo köküdür (`./`).

## 2. Ortam değişkenlerini doldurun

`.env.dokploy.example` içeriğini servisin **Environment** bölümüne kopyalayın.

- `SITE_URL`: HTTPS içeren gerçek site adresi. Hem frontend derlemesine hem çalışma ortamına aktarılır.
- `POSTGRES_PASSWORD`: Veritabanı parolası. Örneğin `openssl rand -hex 24` çıktısını kullanabilirsiniz; bu biçim bağlantı metni ve ortam değişkeni kaçış sorunlarını önler.
- `ADMIN_EMAIL`: İlk yönetici hesabının e-posta adresi.
- `ADMIN_PASSWORD`: En az 10 karakter; büyük harf, küçük harf ve rakam içeren güçlü bir parola.
- `DEMO_EMAIL` / `DEMO_PASSWORD` (isteğe bağlı): Paneldeki her şeyi görebilen ama değişiklik yapamayan demo hesabı. İkisi de doluysa ilk açılışta oluşturulur; bilgiler paylaşılacağı için hatalı denemelerle kilitlenmez. Parola en az 10 karakter olmalı ve büyük harf, küçük harf ve rakam içermelidir.
- `SEED_SAMPLE_CONTENT`: İlk açılışta örnek içerik isteniyorsa `true`; boş site isteniyorsa `false`.
- `OPENROUTER_API_KEY`: Yapay zekâ özellikleri kullanılacaksa doldurun.
- `SMTP_*`: Bildirim e-postaları için sağlayıcınızın bilgilerini girin. Panelde site ayarlarından bildirim alacak e-posta adresini de belirleyin.

Zorunlu değişkenler eksikse Compose açıklayıcı bir hata vererek durur. `api-data`, yüklenen dosyaları ve oturum şifreleme anahtarlarını; `postgres-data`, veritabanını saklar.

## 3. Ağ ve alan adını ayarlayın

1. **Isolated Deployments** seçeneğini açın. Dokploy servisleri ve Traefik'i aynı izole ağa bağlar; Compose dosyasına ayrıca `dokploy-network` eklemeyin.
2. Alan adınızın DNS `A` kaydını sunucu IP adresine yönlendirin.
3. Servisin **Domains** bölümünde şu ayarlarla alan adını ekleyin:

| Alan | Değer |
| --- | --- |
| Host | Kendi alan adınız, örneğin `veykivo.com` |
| Service | `web` |
| Container Port | `3000` |
| Path | `/` |
| HTTPS | Açık |
| Certificate | Let's Encrypt |

Host portu yayınlanmaz. Dokploy, Traefik etiketlerini alan adı ayarlarından oluşturur. API istekleri ve yüklenen görseller Next.js üzerinden aynı alan adında sunulur.

## 4. Dağıtın ve kontrol edin

1. **Preview Compose** ile son yapılandırmayı inceleyin.
2. **Deploy** düğmesine basın.
3. PostgreSQL sağlıklı olduğunda API başlar; migration'ları uygular ve ilk yönetici hesabını oluşturur. API sağlıklı olduğunda web servisi başlar.
4. Siteyi HTTPS üzerinden açın; `/blog` ve `/admin/giris` sayfalarını kontrol edin.
5. Yönetici hesabıyla girip içerik kaydı ve görsel yükleme işlemlerini deneyin.
6. Sunucuda `docker network inspect <Dokploy-ag-adi>` ile ağın alt ağını bulun; `FORWARD_NETWORK_CIDR` değerini bu CIDR'a daraltıp yeniden dağıtın.

Yeni veritabanı açılır. Bilgisayarınızdaki mevcut içerikler ve panelden yüklediğiniz dosyalar otomatik taşınmaz; gerekiyorsa veritabanı yedeğini ve yüklenen dosyaları ayrıca aktarın.

## 5. Güncellemeler ve yedekler

- Yeni kodu GitHub'a gönderip yeniden dağıtın. `SITE_URL` değişirse frontend yeniden derlenmelidir.
- PostgreSQL için düzenli `pg_dump` yedeği alın; `api-data` için Dokploy Volume Backups kullanabilirsiniz.
- Kalıcı volume'ler, içeriklerin yeniden dağıtımda korunmasını sağlar. Volume'leri silen işlemler verileri kaldırır.
- Mevcut yönetici parolası, yalnız `ADMIN_PASSWORD` değişkenini değiştirerek güncellenmez. PostgreSQL volume'ü oluştuktan sonra DB parolası değişikliği de veritabanına ayrıca uygulanmalıdır.

## Yerelde yalnız yapılandırmayı doğrulama

Gerçek değerlerle doldurulmuş, Git'te yok sayılan `.env.dokploy` dosyasıyla proje kökünde çalıştırın:

```bash
docker compose --env-file .env.dokploy -f docker-compose.dokploy.yml config --quiet
```

Bu komut container başlatmaz. Yerel doğrulama, Dokploy'un dağıtım sırasında eklediği ağ ve Traefik ayarlarını kapsamaz.

## Kaynaklar

- [Dokploy Docker Compose](https://docs.dokploy.com/docs/core/docker-compose)
- [İzole dağıtımlar](https://docs.dokploy.com/docs/core/docker-compose/utilities#isolated-deployments)
- [Compose alan adları](https://docs.dokploy.com/docs/core/docker-compose/domains)
