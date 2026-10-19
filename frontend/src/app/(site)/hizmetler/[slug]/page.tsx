import { JsonLd } from "@/components/site/json-ld";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHero } from "@/components/site/page-hero";
import { ContentImage } from "@/components/site/content-image";
import { Markdown } from "@/components/site/markdown";
import { ServiceIcon } from "@/components/site/service-icon";
import { ActionLink } from "@/components/site/action-link";
import { DetailSkeleton } from "@/components/site/detail-skeleton";
import { getService, getServices, slugParams } from "@/lib/api/content";
import { quoteHref, siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return slugParams("service");
}

export async function generateMetadata({ params }: PageProps<"/hizmetler/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: "Hizmet bulunamadı", robots: { index: false } };
  const title = service.seoTitle || service.title;
  const description = service.seoDescription || service.summary;
  return {
    title: { absolute: title.includes("Veykivo") ? title : `${title} | Veykivo` },
    description,
    alternates: { canonical: `/hizmetler/${slug}` },
    openGraph: {
      title,
      description,
      url: `/hizmetler/${slug}`,
      images: service.coverImage ? [{ url: service.coverImage.url, alt: service.coverImage.altText }] : undefined,
    },
  };
}

export default function ServicePage(props: PageProps<"/hizmetler/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ServiceDetail params={props.params} />
    </Suspense>
  );
}

async function ServiceDetail({ params }: Pick<PageProps<"/hizmetler/[slug]">, "params">) {
  const { slug } = await params;
  const [service, all] = await Promise.all([getService(slug), getServices()]);
  if (!service) notFound();

  const others = all.filter((s) => s.slug !== slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.summary,
    provider: { "@type": "Organization", name: "Veykivo", url: siteUrl },
    url: `${siteUrl}/hizmetler/${slug}`,
    areaServed: "TR",
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHero
        title={service.title}
        lead={service.summary}
        crumbs={[{ label: "Hizmetlerimiz", href: "/hizmetler" }, { label: service.title }]}
      >
        <div className="mt-9 flex flex-wrap gap-3">
          <ActionLink href={quoteHref} size="lg">
            Bu hizmet için teklif al
          </ActionLink>
        </div>
      </PageHero>

      <div className="container-x">
        <ContentImage
          media={service.coverImage}
          sizes="100vw"
          priority
          className="notch aspect-[16/9] md:aspect-[21/9]"
          fallbackLabel={service.title}
        />
      </div>

      <section className="container-x grid gap-14 py-16 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Markdown>{service.body}</Markdown>
        </div>

        <aside className="lg:col-span-4 lg:col-start-9">
          <div className="notch notch-sm sticky top-[calc(var(--header-h)+1.5rem)] bg-ink p-7 text-on-ink">
            <ServiceIcon name={service.icon} className="size-8 text-signal" />
            <h2 className="mt-5 text-h3">Projeniz için yol haritası çıkaralım</h2>
            <p className="mt-3 text-on-ink-muted">
              İhtiyacınızı anlatın, kapsamı ve tahmini süreyi içeren bir öneri hazırlayalım.
            </p>
            <ActionLink href={quoteHref} className="mt-6 w-full">
              Teklif al
            </ActionLink>
          </div>

          {others.length > 0 && (
            <nav aria-label="Diğer hizmetler" className="mt-10">
              <h2 className="font-semibold text-ink">Diğer hizmetler</h2>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {others.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/hizmetler/${s.slug}`}
                      className="flex items-center gap-3 py-3 text-ink/85 transition-colors hover:text-ink"
                    >
                      <ServiceIcon name={s.icon} className="size-4 text-teal" />
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </aside>
      </section>
    </>
  );
}
