import { JsonLd } from "@/components/site/json-ld";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { ContentImage } from "@/components/site/content-image";
import { Markdown } from "@/components/site/markdown";
import { ServiceIcon } from "@/components/site/service-icon";
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
        <div className="page-hero-actions">
          <Link href={quoteHref} className="landing-button landing-button-light">
            Bu hizmet için teklif al <span><ArrowUpRight aria-hidden /></span>
          </Link>
        </div>
      </PageHero>

      <div className="landing-shell pb-4">
        <ContentImage
          media={service.coverImage}
          sizes="100vw"
          priority
          className="rounded-2xl aspect-[16/9] md:aspect-[21/9]"
          fallbackLabel={service.title}
        />
      </div>

      <section className="page-body">
        <div className="landing-shell grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Markdown>{service.body}</Markdown>
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="landing-panel sticky top-[calc(var(--header-h)+1.5rem)]">
              <ServiceIcon name={service.icon} className="size-8 text-[#a1b7ff]" />
              <h2 className="mt-5 text-[1.35rem] leading-snug tracking-[-0.02em]">Projeniz için yol haritası çıkaralım</h2>
              <p>İhtiyacınızı anlatın, kapsamı ve tahmini süreyi içeren bir öneri hazırlayalım.</p>
              <Link href={quoteHref} className="landing-button landing-button-light mt-7 w-full justify-between">
                Teklif al <span><ArrowUpRight aria-hidden /></span>
              </Link>
            </div>

            {others.length > 0 && (
              <nav aria-label="Diğer hizmetler" className="mt-10">
                <h2 className="text-[0.7rem] font-semibold tracking-[0.08em] text-[#878da0] uppercase">Diğer hizmetler</h2>
                <ul className="landing-side-list mt-3">
                  {others.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/hizmetler/${s.slug}`}>
                        <ServiceIcon name={s.icon} className="size-4 text-[#6a7ba6]" />
                        {s.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
