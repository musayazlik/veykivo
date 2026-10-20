import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { RevealMask } from "@/components/site/reveal";
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

      <div className="page-body">
        <div className="landing-shell">
          <section className="grid gap-12 md:grid-cols-12 md:gap-16">
            <RevealMask className="md:col-span-7">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#e3e7ef]">
                <Image src="/images/about/ofis.jpg" alt="Veykivo ofisinde çalışma alanı" fill priority sizes="(min-width: 768px) 58vw, 100vw" className="object-cover" />
              </div>
            </RevealMask>
            <div className="self-end md:col-span-5">
              <p className="landing-kicker">Hikâyemiz</p>
              <div className="mt-5 space-y-4 text-[15px] leading-[1.85] text-[#3c4150]">
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

          <section className="mt-24 grid gap-5 md:grid-cols-2">
            <div className="landing-panel md:mt-9">
              <p className="landing-kicker !mb-0 text-[#8fa5e0]">Misyonumuz</p>
              <p className="!mt-4 text-[clamp(20px,1.8vw,26px)] !leading-[1.35] font-medium tracking-[-0.03em] text-[#f4f6ff]">
                İşletmelerin zamanını tekrar eden işlerden kurtarıp gerçekten değer ürettikleri işe ayırmalarını sağlamak.
              </p>
            </div>
            <div className="landing-panel">
              <p className="landing-kicker !mb-0 text-[#8fa5e0]">Vizyonumuz</p>
              <p className="!mt-4 text-[clamp(20px,1.8vw,26px)] !leading-[1.35] font-medium tracking-[-0.03em] text-[#f4f6ff]">
                Türkiye&apos;de orta ölçekli işletmelerin ilk aklına gelen, güvenilir yazılım ortağı olmak.
              </p>
            </div>
          </section>

          <section className="mt-28">
            <div className="landing-section-heading">
              <div>
                <p className="landing-kicker">Çalışma yaklaşımımız</p>
                <h2>Her projede değişmeyen<br />dört ilke.</h2>
              </div>
            </div>
            <ol className="landing-process">
              {principles.map((p, i) => (
                <li key={p.title}>
                  <span className="landing-step-index">0{i + 1}</span>
                  <div>
                    <h3>{p.title}</h3>
                    <p>{p.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-28 grid items-center gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="landing-kicker">Ekibimiz</p>
              <h2 className="text-[clamp(26px,2.6vw,40px)] leading-[1.15] tracking-[-0.04em]">Projelerinizi geliştiren ekip</h2>
              <p className="mt-5 text-[15px] leading-[1.85] text-[#646a7c]">
                Ürün yöneticisi, tasarımcı ve geliştiricilerden oluşan küçük, deneyimli bir ekibiz. Projenizde kiminle
                çalışacağınızı baştan bilirsiniz.
              </p>
              <Link href="/kurumsal/ekibimiz" className="landing-button landing-button-dark mt-8">
                Ekibimizle tanışın <span><ArrowUpRight aria-hidden /></span>
              </Link>
            </div>
            <RevealMask className="md:col-span-7">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#e3e7ef]">
                <Image src="/images/about/ekip.jpg" alt="Veykivo ekibi toplantı sırasında" fill sizes="(min-width: 768px) 58vw, 100vw" className="object-cover" />
              </div>
            </RevealMask>
          </section>
        </div>
      </div>

      <CtaBand />
    </>
  );
}
