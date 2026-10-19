import type { Metadata } from "next";
import Link from "next/link";
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

      <section className="container-x pb-8">
        {services.length === 0 ? (
          <p className="border-t border-line py-10 text-muted-foreground">Hizmetler yakında burada listelenecek.</p>
        ) : (
          <ul className="grid gap-x-10 gap-y-16 md:grid-cols-2">
            {services.map((s, i) => (
              <li key={s.slug} className="group relative">
                <ContentImage
                  media={s.coverImage}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority={i < 2}
                  className="notch aspect-[16/10] transition-[filter] duration-500 group-hover:brightness-95"
                  fallbackLabel={s.title}
                />
                <div className="mt-6 flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-ink text-signal">
                    <ServiceIcon name={s.icon} className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-[1.6rem] leading-tight font-bold tracking-[-0.02em] text-ink">
                      <Link href={`/hizmetler/${s.slug}`} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
                        {s.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-muted-foreground">{s.summary}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CtaBand
        title="Hangi hizmetin size uygun olduğundan emin değil misiniz?"
        text="Sorununuzu anlatın; doğru yaklaşımı birlikte belirleyelim. Gerekirse birkaç hizmeti tek bir yol haritasında birleştiriyoruz."
      />
    </>
  );
}
