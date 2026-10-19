import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { ProjectCase } from "@/components/site/project-case";
import { CtaBand } from "@/components/site/cta-band";
import { getProjects } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Projelerimiz",
  description: "Lojistik, üretim, sağlık ve finans sektörlerinde geliştirdiğimiz kurumsal yazılım projelerinden örnekler.",
  alternates: { canonical: "/projeler" },
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <>
      <PageHero
        title="Sahada çalışan sistemler"
        lead="Her proje bir iş problemiyle başladı. İhtiyacı, kurduğumuz çözümü ve sonrasında neyin değiştiğini anlatıyoruz."
        crumbs={[{ label: "Projelerimiz" }]}
      />
      <section className="container-x pb-8">
        {projects.length === 0 ? (
          <p className="border-t border-line py-10 text-muted-foreground">Projeler yakında burada yayınlanacak.</p>
        ) : (
          <div className="space-y-20 md:space-y-28">
            {projects.map((p, i) => (
              <ProjectCase key={p.slug} project={p} flip={i % 2 === 1} headingLevel="h2" />
            ))}
          </div>
        )}
      </section>
      <CtaBand title="Sıradaki proje sizinki olabilir." />
    </>
  );
}
