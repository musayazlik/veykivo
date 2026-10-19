import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/site/page-hero";
import { RevealMask } from "@/components/site/reveal";
import { ActionLink } from "@/components/site/action-link";
import { CtaBand } from "@/components/site/cta-band";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Veykivo'nun hikâyesi, misyonu, vizyonu ve işletmelere özel yazılım geliştirirken benimsediği çalışma yaklaşımı.",
  alternates: { canonical: "/kurumsal/hakkimizda" },
};

const principles = [
  {
    title: "Önce süreci anlarız",
    text: "Kod yazmadan önce işinizin gerçekte nasıl yürüdüğünü sahada, çalışanlarınızla birlikte öğreniriz.",
  },
  {
    title: "Küçük ve sık teslim ederiz",
    text: "Büyük bir lansman yerine iki haftada bir kullanılabilir sürümler çıkarır, geri bildirimle yön buluruz.",
  },
  {
    title: "Sahipliği size bırakırız",
    text: "Kaynak kod, veri ve dokümantasyon sizindir. Bizimle devam etmek zorunda kalmadığınız bir sistem kurarız.",
  },
  {
    title: "Sade olanı seçeriz",
    text: "Gerekmediği sürece karmaşık mimari kurmayız; bakımı kolay sistemler uzun yaşar.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="Yazılımı, işin kendisini anlayarak geliştiriyoruz"
        lead="Veykivo; operasyonu karmaşıklaşan işletmelerin dağınık araçlarını tek, anlaşılır ve uzun ömürlü sistemlere dönüştürmek için kuruldu."
        crumbs={[{ label: "Kurumsal" }, { label: "Hakkımızda" }]}
      />

      <section className="container-x grid gap-12 pb-20 md:grid-cols-12 md:pb-28">
        <RevealMask className="md:col-span-7">
          <div className="notch relative aspect-[4/3] bg-mist">
            <Image src="/images/about/ofis.jpg" alt="Veykivo ofisinde çalışma alanı" fill priority sizes="(min-width: 768px) 58vw, 100vw" className="object-cover" />
          </div>
        </RevealMask>
        <div className="self-end md:col-span-5">
          <h2 className="text-h2 text-ink">Hikâyemiz</h2>
          <div className="mt-6 space-y-4 text-ink/85">
            <p>
              Kurucularımız yıllarca büyük ölçekli kurumsal projelerde çalıştı ve aynı tabloyu defalarca gördü: Excel
              dosyaları, birbirine bağlanmayan programlar ve aynı veriyi üç kez giren ekipler.
            </p>
            <p>
              Veykivo&apos;yu, bu sorunu hazır paketlerin kalıplarına sığdırmak yerine işletmenin kendi akışına göre
              çözmek için kurduk. Bugün farklı sektörlerden işletmelerle, onların ekibinin bir parçası gibi çalışıyoruz.
            </p>
          </div>
        </div>
      </section>

      <section className="blueprint-dark bg-ink py-20 text-on-ink md:py-28">
        <div className="container-x grid gap-14 md:grid-cols-2 md:gap-20">
          <div>
            <h2 className="text-h3 text-signal">Misyonumuz</h2>
            <p className="mt-4 text-[1.5rem] leading-snug font-semibold tracking-[-0.015em] md:text-[1.85rem]">
              İşletmelerin zamanını tekrar eden işlerden kurtarıp gerçekten değer ürettikleri işe ayırmalarını sağlamak.
            </p>
          </div>
          <div>
            <h2 className="text-h3 text-signal">Vizyonumuz</h2>
            <p className="mt-4 text-[1.5rem] leading-snug font-semibold tracking-[-0.015em] md:text-[1.85rem]">
              Türkiye&apos;de orta ölçekli işletmelerin ilk aklına gelen, güvenilir yazılım ortağı olmak.
            </p>
          </div>
        </div>
      </section>

      <section className="container-x py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="text-h2 text-ink">Çalışma yaklaşımımız</h2>
            <p className="mt-5 text-muted-foreground">Her projede değişmeyen dört ilke.</p>
          </div>
          <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2 md:col-span-8">
            {principles.map((p) => (
              <div key={p.title} className="border-t-2 border-ink pt-5">
                <dt className="text-h3 text-ink">{p.title}</dt>
                <dd className="mt-3 text-muted-foreground">{p.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-line bg-white py-20 md:py-28">
        <div className="container-x grid items-center gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className="text-h2 text-ink">Projelerinizi geliştiren ekip</h2>
            <p className="mt-5 text-muted-foreground">
              Ürün yöneticisi, tasarımcı ve geliştiricilerden oluşan küçük, deneyimli bir ekibiz. Projenizde kiminle
              çalışacağınızı baştan bilirsiniz.
            </p>
            <ActionLink href="/kurumsal/ekibimiz" variant="dark" className="mt-8">
              Ekibimizle tanışın
            </ActionLink>
          </div>
          <RevealMask className="md:col-span-7">
            <div className="notch relative aspect-[16/10] bg-mist">
              <Image src="/images/about/ekip.jpg" alt="Veykivo ekibi toplantı sırasında" fill sizes="(min-width: 768px) 58vw, 100vw" className="object-cover" />
            </div>
          </RevealMask>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
