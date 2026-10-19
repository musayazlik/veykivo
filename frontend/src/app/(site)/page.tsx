import { JsonLd } from "@/components/site/json-ld";
import Link from "next/link";
import { Check } from "lucide-react";
import { ActionLink } from "@/components/site/action-link";
import { SystemDiagram } from "@/components/site/system-diagram";
import { ServicesIndex } from "@/components/site/services-index";
import { ProjectCase } from "@/components/site/project-case";
import { ProcessTimeline } from "@/components/site/process-timeline";
import { PostCard } from "@/components/site/post-card";
import { CtaBand } from "@/components/site/cta-band";
import { getPosts, getProjects, getServices, getSiteSettings, getTechnologies } from "@/lib/api/content";
import { technologyCategoryLabels, type Technology, type TechnologyCategory } from "@/lib/api/types";
import { quoteHref, siteUrl } from "@/lib/site";

export async function generateMetadata() {
  "use cache";
  const s = await getSiteSettings();
  return {
    title: { absolute: s.seoTitle },
    description: s.seoDescription,
    alternates: { canonical: "/" },
  };
}

const commitments = ["Kaynak kod ve veriler sizin", "İki haftada bir çalışan sürüm", "Yayından sonra da yanınızdayız"];

export default async function HomePage() {
  const [services, projects, technologies, posts, settings] = await Promise.all([
    getServices(),
    getProjects({ featured: true, limit: 3 }),
    getTechnologies(),
    getPosts({ pageSize: 3 }),
    getSiteSettings(),
  ]);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.companyName,
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    email: settings.email || undefined,
    telephone: settings.phone || undefined,
    address: settings.address || undefined,
    sameAs: settings.social.map((s) => s.href),
  };

  return (
    <>
      <JsonLd data={organizationJsonLd} />

      {/* Hero */}
      <section className="relative overflow-hidden pt-[calc(var(--header-h)+2.5rem)] pb-20 md:pt-[calc(var(--header-h)+4rem)] md:pb-28">
        <div
          aria-hidden
          className="blueprint pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_70%_40%,black_20%,transparent_70%)]"
        />
        <div className="container-x relative grid grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12">
          <div className="hero-rise">
            <h1 className="text-display text-ink">İşinizin nasıl yürüdüğünü yazılıma dönüştürüyoruz.</h1>
            <p className="mt-7 max-w-xl text-lead text-muted-foreground">
              Veykivo; sipariş, stok, saha ve finans süreçlerinizi tek bir sistemde buluşturan web, mobil ve ERP
              çözümleri tasarlar, geliştirir ve yıllarca ayakta tutar.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ActionLink href={quoteHref} size="lg">
                Teklif al
              </ActionLink>
              <ActionLink href="/projeler" size="lg" variant="outline">
                Projeleri incele
              </ActionLink>
            </div>
            <ul className="mt-12 flex flex-col gap-3 text-[0.95rem] text-ink/80 sm:flex-row sm:flex-wrap sm:gap-x-7">
              {commitments.map((c) => (
                <li key={c} className="flex items-center gap-2">
                  <Check aria-hidden className="size-4 text-teal" strokeWidth={2.5} />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SystemDiagram className="mx-auto w-full max-w-[36rem] lg:mr-0" />
          </div>
        </div>
      </section>

      {/* Hizmetler */}
      <section aria-labelledby="hizmetler-baslik" className="container-x py-20 md:py-28">
        <div className="mb-12 grid gap-6 md:grid-cols-12 md:items-end">
          <h2 id="hizmetler-baslik" className="text-h2 text-ink md:col-span-6">
            Ne yapıyoruz
          </h2>
          <div className="md:col-span-5 md:col-start-8">
            <p className="text-muted-foreground">
              Tek bir uygulamadan uçtan uca dijital dönüşüme kadar, her işi aynı mühendislik disipliniyle ele alıyoruz.
            </p>
            <Link href="/hizmetler" className="mt-3 inline-block font-semibold text-teal underline-offset-4 hover:underline">
              Tüm hizmetler
            </Link>
          </div>
        </div>
        <ServicesIndex services={services} />
      </section>

      {/* Projeler */}
      {projects.length > 0 && (
        <section aria-labelledby="projeler-baslik" className="border-t border-line bg-white py-20 md:py-28">
          <div className="container-x">
            <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
              <h2 id="projeler-baslik" className="text-h2 text-ink">
                Seçili projeler
              </h2>
              <ActionLink href="/projeler" variant="outline">
                Tüm projeler
              </ActionLink>
            </div>
            <div className="space-y-20 md:space-y-28">
              {projects.map((p, i) => (
                <ProjectCase key={p.slug} project={p} flip={i % 2 === 1} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Süreç */}
      <section aria-labelledby="surec-baslik" className="blueprint-dark bg-ink py-20 text-on-ink md:py-28">
        <div className="container-x">
          <div className="mb-16 grid gap-6 md:grid-cols-12 md:items-end">
            <h2 id="surec-baslik" className="text-h2 md:col-span-6">
              Nasıl çalışıyoruz
            </h2>
            <p className="text-on-ink-muted md:col-span-5 md:col-start-8">
              Sürprizsiz bir süreç: her aşamanın sonunda ne teslim edileceğini baştan biliyorsunuz.
            </p>
          </div>
          <ProcessTimeline />
        </div>
      </section>

      {/* Teknolojiler */}
      {technologies.length > 0 && (
        <section aria-labelledby="teknoloji-baslik" className="container-x py-20 md:py-28">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <h2 id="teknoloji-baslik" className="text-h2 text-ink">
                Teknoloji yığınımız
              </h2>
              <p className="mt-5 text-muted-foreground">
                Moda olana değil, projenizin ömrü boyunca bakımı kolay ve iyi desteklenen araçlara yatırım yapıyoruz.
              </p>
              <Link
                href="/teknolojiler"
                className="mt-4 inline-block font-semibold text-teal underline-offset-4 hover:underline"
              >
                Teknolojileri incele
              </Link>
            </div>
            <TechGroups technologies={technologies} className="md:col-span-7 md:col-start-6" />
          </div>
        </section>
      )}

      {/* Blog */}
      {posts.items.length > 0 && (
        <section aria-labelledby="blog-baslik" className="border-t border-line bg-white py-20 md:py-28">
          <div className="container-x">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <h2 id="blog-baslik" className="text-h2 text-ink">
                Blogdan
              </h2>
              <ActionLink href="/blog" variant="outline">
                Tüm yazılar
              </ActionLink>
            </div>
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
              {posts.items.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}

function TechGroups({ technologies, className }: { technologies: Technology[]; className?: string }) {
  const groups = technologies.reduce(
    (acc, t) => ((acc[t.category] ??= []).push(t), acc),
    {} as Partial<Record<TechnologyCategory, Technology[]>>,
  );
  return (
    <dl className={className}>
      {(Object.keys(technologyCategoryLabels) as TechnologyCategory[]).filter((c) => groups[c]).map((cat) => (
        <div key={cat} className="grid gap-3 border-t border-line py-5 sm:grid-cols-[11rem_1fr]">
          <dt className="font-semibold text-ink">{technologyCategoryLabels[cat]}</dt>
          <dd className="flex flex-wrap gap-2">
            {groups[cat]!.map((t) => (
              <span key={t.id} className="rounded-sm border border-line bg-white px-3 py-1 text-[0.95rem] text-ink/85">
                {t.name}
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
