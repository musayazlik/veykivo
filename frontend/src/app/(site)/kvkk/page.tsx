import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "KVKK aydınlatma metni",
  description: "Veykivo kişisel verilerin korunması kanunu kapsamında aydınlatma metni.",
  alternates: { canonical: "/kvkk" },
};

const body = `
## Veri sorumlusu

6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla **[Şirket ünvanı]** ("Veykivo") tarafından aşağıda açıklanan kapsamda işlenmektedir.

## İşlenen kişisel veriler

İletişim ve teklif formu aracılığıyla paylaştığınız ad soyad, e-posta adresi, telefon numarası, şirket adı ve mesaj içeriği işlenmektedir.

## İşleme amaçları

- Talebinize dönüş yapılması ve teklif hazırlanması
- Sözleşme öncesi görüşmelerin yürütülmesi
- Hukuki yükümlülüklerin yerine getirilmesi

## Hukuki sebep ve toplama yöntemi

Kişisel verileriniz, internet sitemizdeki form aracılığıyla elektronik ortamda; KVKK m.5/2-(c) "bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması" ve m.5/2-(f) "meşru menfaat" hukuki sebeplerine dayanılarak toplanmaktadır.

## Aktarım

Kişisel verileriniz yalnızca hizmet aldığımız barındırma ve e-posta altyapısı sağlayıcılarıyla, yukarıdaki amaçlarla sınırlı olarak paylaşılır.

## Saklama süresi

Talep kayıtları, işleme amacının gerektirdiği süre boyunca ve en fazla **[süre]** saklanır; sürenin sonunda silinir veya anonim hale getirilir.

## Haklarınız

KVKK m.11 kapsamındaki haklarınıza ilişkin taleplerinizi **[e-posta adresi]** adresine iletebilirsiniz.
`;

export default function KvkkPage() {
  return <LegalPage title="KVKK aydınlatma metni" updated="Taslak" body={body} />;
}
