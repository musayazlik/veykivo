import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { ContentImage } from "@/components/site/content-image";
import { CtaBand } from "@/components/site/cta-band";
import { getTeam } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Ekibimiz",
  description: "Veykivo'da projelerinizi planlayan, tasarlayan ve geliştiren ekip.",
  alternates: { canonical: "/kurumsal/ekibimiz" },
};

export default async function TeamPage() {
  const team = await getTeam();

  return (
    <>
      <PageHero
        title="Projenizde kiminle çalışacağınızı bilin"
        lead="Satış ekibi ile geliştirme ekibi arasında kaybolan bilgi yok. İlk görüşmeden yayına kadar aynı insanlarla ilerlersiniz."
        crumbs={[{ label: "Kurumsal" }, { label: "Ekibimiz" }]}
      />

      <section className="page-body">
        <div className="landing-shell">
          {team.length === 0 ? (
            <p className="landing-empty">Ekip bilgileri yakında yayınlanacak.</p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((m, i) => (
                <li key={m.id} className="landing-card">
                  <ContentImage
                    media={m.photo}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    priority={i < 4}
                    className="landing-card-media aspect-[4/5] grayscale-[35%]"
                    fallbackLabel={m.name}
                  />
                  <div className="landing-card-body">
                    <h3>{m.name}</h3>
                    <p className="!mt-1.5 text-[13.5px] font-medium !text-[#5a6fd8]">{m.roleTitle}</p>
                    {m.bio && <p className="!mt-3 text-[13.5px]">{m.bio}</p>}
                    {m.linkedInUrl && (
                      <a
                        href={m.linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="landing-card-link !mt-5 !text-[#3d56c9]"
                      >
                        LinkedIn profili <ArrowUpRight aria-hidden />
                        <span className="sr-only">: {m.name}</span>
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <CtaBand title="Ekibimizle tanışmak ister misiniz?" />
    </>
  );
}
