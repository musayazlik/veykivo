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
      <section className="page-body">
        <div className="landing-shell">
          {projects.length === 0 ? (
            <p className="landing-empty">Yeni çalışmalarımızı yakında burada paylaşacağız.</p>
          ) : (
            <div className="landing-project-grid">
              {projects.map((p) => (
                <ProjectCase key={p.slug} project={p} headingLevel="h2" />
              ))}
            </div>
          )}
        </div>
      </section>
      <CtaBand title="Sıradaki proje sizinki olabilir." />
    </>
  );
}
