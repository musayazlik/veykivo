import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { ContentImage } from "@/components/site/content-image";
import { DetailSkeleton } from "@/components/site/detail-skeleton";
import { CtaBand } from "@/components/site/cta-band";
import { getProject, getProjects, slugParams } from "@/lib/api/content";
import { technologyCategoryLabels } from "@/lib/api/types";
import { formatDate } from "@/lib/site";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return slugParams("project");
}

export async function generateMetadata({ params }: PageProps<"/projeler/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Proje bulunamadı", robots: { index: false } };
  const title = project.seoTitle || project.title;
  const description = project.seoDescription || project.summary;
  return {
    title,
    description,
    alternates: { canonical: `/projeler/${slug}` },
    openGraph: {
      title,
      description,
      url: `/projeler/${slug}`,
      images: project.coverImage ? [{ url: project.coverImage.url, alt: project.coverImage.altText }] : undefined,
    },
  };
}

export default function ProjectPage(props: PageProps<"/projeler/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProjectDetail params={props.params} />
    </Suspense>
  );
}

async function ProjectDetail({ params }: Pick<PageProps<"/projeler/[slug]">, "params">) {
  const { slug } = await params;
  const [project, all] = await Promise.all([getProject(slug), getProjects()]);
  if (!project) notFound();

  const index = all.findIndex((p) => p.slug === slug);
  const next = all.length > 1 ? all[(index + 1) % all.length] : null;

  const story = [
    { title: "İhtiyaç", text: project.challenge },
    { title: "Çözüm", text: project.solution },
    { title: "Sonuç", text: project.outcome },
  ].filter((s) => s.text.trim().length > 0);

  return (
    <>
      <PageHero
        title={project.title}
        lead={project.summary}
        crumbs={[{ label: "Projelerimiz", href: "/projeler" }, { label: project.title }]}
      />

      <div className="landing-shell pb-4">
        <ContentImage
          media={project.coverImage}
          sizes="100vw"
          priority
          className="rounded-2xl aspect-[16/9] md:aspect-[21/9]"
          fallbackLabel={project.title}
        />
      </div>

      <section className="page-body">
        <div className="landing-shell grid gap-14 lg:grid-cols-12 lg:gap-16">
          <aside className="lg:col-span-3">
            <dl className="landing-meta lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
              {project.clientName && (
                <div>
                  <dt>Müşteri</dt>
                  <dd>{project.clientName}</dd>
                </div>
              )}
              {project.sector && (
                <div>
                  <dt>Sektör</dt>
                  <dd>{project.sector}</dd>
                </div>
              )}
              {project.publishedAt && (
                <div>
                  <dt>Yayın</dt>
                  <dd>{formatDate(project.publishedAt)}</dd>
                </div>
              )}
              {project.technologies.length > 0 && (
                <div>
                  <dt>Teknolojiler</dt>
                  <dd className="mt-2.5 flex flex-wrap gap-2">
                    {project.technologies.map((t) => (
                      <span key={t.id} title={technologyCategoryLabels[t.category]} className="landing-chip landing-chip-sm">
                        {t.name}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </aside>

          <div className="lg:col-span-8 lg:col-start-5">
            {story.map((block, i) => (
              <section
                key={block.title}
                className={cn("grid gap-3 border-t border-[#e0e3ee] py-9 md:grid-cols-[8rem_1fr] md:gap-8", i === 0 && "border-t-0 pt-0")}
              >
                <h2 className="pt-1.5 text-[0.7rem] font-semibold tracking-[0.08em] text-[#878da0] uppercase">{block.title}</h2>
                <p className="text-[1.05rem] leading-[1.8] whitespace-pre-line text-[#3c4150]">{block.text}</p>
              </section>
            ))}
          </div>
        </div>

        {next && (
          <div className="landing-shell mt-4 flex flex-wrap items-center justify-between gap-6 border-t border-[#e0e3ee] pt-10">
            <Link href="/projeler" className="landing-dark-link">
              <ArrowLeft aria-hidden className="rotate-180" /> Tüm projeler
            </Link>
            <Link href={`/projeler/${next.slug}`} className="group text-right">
              <span className="block text-[11px] tracking-[0.04em] text-[#878da0] uppercase">Sonraki proje</span>
              <span className="mt-1 inline-flex items-center gap-2 text-[1.35rem] font-medium tracking-[-0.03em] text-[#171922] group-hover:text-[#3d56c9]">
                {next.title} <ArrowUpRight aria-hidden className="size-5" />
              </span>
            </Link>
          </div>
        )}
      </section>

      <CtaBand />
    </>
  );
}
