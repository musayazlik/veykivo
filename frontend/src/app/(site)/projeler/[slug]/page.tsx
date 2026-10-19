import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { ContentImage } from "@/components/site/content-image";
import { DetailSkeleton } from "@/components/site/detail-skeleton";
import { CtaBand } from "@/components/site/cta-band";
import { getProject, getProjects, slugParams } from "@/lib/api/content";
import { technologyCategoryLabels } from "@/lib/api/types";
import { formatDate } from "@/lib/site";

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

      <div className="container-x">
        <ContentImage
          media={project.coverImage}
          sizes="100vw"
          priority
          className="notch aspect-[16/9] md:aspect-[21/9]"
          fallbackLabel={project.title}
        />
      </div>

      <section className="container-x grid gap-14 py-16 md:py-24 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <dl className="space-y-6 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            {project.clientName && (
              <div>
                <dt className="text-sm text-muted-foreground">Müşteri</dt>
                <dd className="mt-1 font-semibold text-ink">{project.clientName}</dd>
              </div>
            )}
            {project.sector && (
              <div>
                <dt className="text-sm text-muted-foreground">Sektör</dt>
                <dd className="mt-1 font-semibold text-ink">{project.sector}</dd>
              </div>
            )}
            {project.publishedAt && (
              <div>
                <dt className="text-sm text-muted-foreground">Yayın</dt>
                <dd className="mt-1 font-semibold text-ink">{formatDate(project.publishedAt)}</dd>
              </div>
            )}
            {project.technologies.length > 0 && (
              <div>
                <dt className="text-sm text-muted-foreground">Teknolojiler</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {project.technologies.map((t) => (
                    <span
                      key={t.id}
                      title={technologyCategoryLabels[t.category]}
                      className="rounded-sm border border-line bg-white px-2.5 py-1 text-sm text-ink/85"
                    >
                      {t.name}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </aside>

        <div className="lg:col-span-8 lg:col-start-5">
          {story.map((block) => (
            <section key={block.title} className="grid gap-4 border-t border-line py-10 first:border-t-0 first:pt-0 md:grid-cols-[9rem_1fr]">
              <h2 className="text-h3 text-teal">{block.title}</h2>
              <p className="text-[1.125rem] leading-[1.75] text-ink/85 whitespace-pre-line">{block.text}</p>
            </section>
          ))}
        </div>
      </section>

      {next && (
        <section className="border-t border-line bg-white">
          <div className="container-x flex flex-wrap items-center justify-between gap-6 py-12">
            <Link href="/projeler" className="inline-flex items-center gap-2 font-medium text-ink/75 hover:text-ink">
              <ArrowLeft aria-hidden className="size-4" />
              Tüm projeler
            </Link>
            <Link href={`/projeler/${next.slug}`} className="group text-right">
              <span className="block text-sm text-muted-foreground">Sonraki proje</span>
              <span className="text-[1.5rem] font-bold tracking-[-0.02em] text-ink group-hover:underline group-hover:underline-offset-4">
                {next.title}
              </span>
            </Link>
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}
