import type { Metadata } from "next";
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

      <section className="container-x pb-8">
        {team.length === 0 ? (
          <p className="border-t border-line py-10 text-muted-foreground">Ekip bilgileri yakında yayınlanacak.</p>
        ) : (
          <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m, i) => (
              <li key={m.id}>
                <ContentImage
                  media={m.photo}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  priority={i < 4}
                  className="notch notch-sm aspect-[4/5] grayscale-[35%]"
                  fallbackLabel={m.name}
                />
                <h2 className="mt-5 text-[1.25rem] font-bold text-ink">{m.name}</h2>
                <p className="font-medium text-teal">{m.roleTitle}</p>
                {m.bio && <p className="mt-3 text-[0.975rem] text-muted-foreground">{m.bio}</p>}
                {m.linkedInUrl && (
                  <a
                    href={m.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-ink underline-offset-4 hover:underline"
                  >
                    LinkedIn profili<span className="sr-only">: {m.name}</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <CtaBand title="Ekibimizle tanışmak ister misiniz?" />
    </>
  );
}
