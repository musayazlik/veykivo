import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Gizlilik politikası",
  description: "Veykivo internet sitesi gizlilik politikası.",
  alternates: { canonical: "/gizlilik-politikasi" },
};

const body = `
## Kapsam

Bu politika, **[alan adı]** internet sitesini ziyaret ettiğinizde hangi bilgilerin toplandığını ve nasıl kullanıldığını açıklar.

## Toplanan bilgiler

- **Formlar:** İletişim ve teklif formuna kendi isteğinizle yazdığınız bilgiler.
- **Teknik kayıtlar:** Güvenlik ve kötüye kullanımın önlenmesi amacıyla IP adresi ve istek zamanı gibi sunucu kayıtları.

## Çerezler

Sitemiz ziyaretçiler için takip veya reklam çerezi kullanmaz. Yalnızca yönetim paneline giriş yapan yetkililer için oturum ve güvenlik çerezleri oluşturulur.

## Güvenlik

Bağlantılar HTTPS ile şifrelenir; form gönderimleri sunucu tarafında doğrulanır ve kötüye kullanıma karşı sınırlandırılır.

## İletişim

Gizlilikle ilgili sorularınız için **[e-posta adresi]** adresine yazabilirsiniz.
`;

export default function PrivacyPage() {
  return <LegalPage title="Gizlilik politikası" updated="Taslak" body={body} />;
}
