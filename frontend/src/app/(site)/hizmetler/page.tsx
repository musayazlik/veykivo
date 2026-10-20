import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { ContentImage } from "@/components/site/content-image";
import { ServiceIcon } from "@/components/site/service-icon";
import { CtaBand } from "@/components/site/cta-band";
import { getServices } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Hizmetlerimiz",
  description:
    "Özel yazılım, web ve mobil uygulama geliştirme, ERP/CRM, yapay zekâ ile otomasyon ve yazılım danışmanlığı hizmetleri.",
  alternates: { canonical: "/hizmetler" },
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <PageHero
        title="İşinizin ihtiyacına göre şekillenen hizmetler"
        lead="Her proje farklı bir noktadan başlar. Bazen tek bir mobil uygulama, bazen tüm operasyonu taşıyan bir ERP. Hangisi olursa olsun aynı ekip, aynı disiplinle çalışır."
        crumbs={[{ label: "Hizmetlerimiz" }]}
      />

      <section className="page-body">
        <div className="landing-shell">
          <div className="landing-section-heading">
            <div>
              <p className="landing-kicker">Çözümlerimiz</p>
              <h2>Bir sonraki adımınızı<br />birlikte tasarlayalım.</h2>
            </div>
            <p>İhtiyacınıza odaklanan, birbiriyle uyum içinde çalışan dijital çözümler geliştiriyoruz.</p>
          </div>

          {services.length === 0 ? (
            <p className="landing-empty">Yeni çözümler üzerinde çalışıyoruz. İhtiyacınızı birlikte değerlendirelim.</p>
          ) : (
            <ul className="grid gap-5 md:grid-cols-2">
              {services.map((s, i) => (
                <li key={s.slug}>
                  <Link href={`/hizmetler/${s.slug}`} className="landing-card group block h-full">
                    <ContentImage
                      media={s.coverImage}
                      sizes="(min-width: 768px) 50vw, 100vw"
                      priority={i < 2}
                      className="landing-card-media aspect-[16/9]"
                      fallbackLabel={s.title}
                    />
                    <div className="landing-card-body">
                      <div className="flex items-start justify-between gap-4">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e9edf9] text-[#53638d]">
                          <ServiceIcon name={s.icon} className="size-5" />
                        </span>
                        <ArrowUpRight className="landing-card-arrow" aria-hidden />
                      </div>
                      <h3 className="mt-5">{s.title}</h3>
                      <p className="flex-1">{s.summary}</p>
                      <span className="landing-card-link">Çözümü keşfedin <ArrowUpRight aria-hidden /></span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <CtaBand
        title="Hangi hizmetin size uygun olduğundan emin değil misiniz?"
        text="Sorununuzu anlatın; doğru yaklaşımı birlikte belirleyelim. Gerekirse birkaç hizmeti tek bir yol haritasında birleştiriyoruz."
      />
    </>
  );
}
