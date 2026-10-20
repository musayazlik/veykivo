import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUpRight, Check, Code2, GitBranch, Layers3, Workflow } from "lucide-react";
import { JsonLd } from "@/components/site/json-ld";
import { HeroArtwork } from "@/components/site/hero-artwork";
import { LandingMotion } from "@/components/site/landing-motion";
import { ServiceIcon } from "@/components/site/service-icon";
import { getPosts, getProjects, getServices, getSiteSettings, getTechnologies } from "@/lib/api/content";
import { homepageImages } from "@/lib/homepage-images";
import { formatDate, quoteHref, siteUrl } from "@/lib/site";

export async function generateMetadata() {
  "use cache";
  const s = await getSiteSettings();
  return { title: { absolute: s.seoTitle }, description: s.seoDescription, alternates: { canonical: "/" } };
}

const process = [
  { title: "Önce sizi dinliyoruz.", body: "İşinizi, kullanıcılarınızı ve çözmek istediğiniz sorunu birlikte anlıyoruz.", icon: Layers3 },
  { title: "Birlikte şekillendiriyoruz.", body: "Fikri somut bir yol haritasına ve deneyimleyebileceğiniz bir prototipe dönüştürüyoruz.", icon: GitBranch },
  { title: "Adım adım geliştiriyoruz.", body: "Kısa geliştirme döngüleriyle ilerliyor, her aşamada çalışan ürünü sizinle paylaşıyoruz.", icon: Code2 },
  { title: "Yolculuğa devam ediyoruz.", body: "Yayına alıyor, izliyor ve işiniz büyüdükçe ürününüzü birlikte geliştiriyoruz.", icon: Workflow },
];

export default async function HomePage() {
  const [services, projects, technologies, posts, settings] = await Promise.all([
    getServices(), getProjects({ featured: true, limit: 2 }), getTechnologies(), getPosts({ page: 1, pageSize: 3 }), getSiteSettings(),
  ]);
  const techNames = technologies.filter((t) => ["Next.js", "React", ".NET", "PostgreSQL", "Docker", "AWS"].includes(t.name));
  const projectCards = projects.map((project) => ({
    ...project,
    coverImage: homepageImages[project.coverImage?.url ?? ""] ?? project.coverImage,
  }));
  const postCards = posts.items.map((post) => ({
    ...post,
    coverImage: homepageImages[post.coverImage?.url ?? ""] ?? post.coverImage,
  }));

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: settings.companyName, url: siteUrl,
        logo: `${siteUrl}/icon.svg`, email: settings.email || undefined, sameAs: settings.social.map((s) => s.href) }} />
      <LandingMotion>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-glow" aria-hidden="true" />
          <div className="landing-shell landing-hero-inner">
            <div className="landing-hero-copy">
              <p className="landing-intro"><span /> Fikirden ürüne, aynı ekiple.</p>
              <h1 id="landing-title">
                {["İyi fikirler,", "güçlü yazılımlarla", "hayat bulur."].map((line, i) => (
                  <span className="landing-title-line" key={line}><span style={{ animationDelay: `${i * 105}ms` }}>{line}</span></span>
                ))}
              </h1>
              <p className="landing-hero-description">Karmaşık süreçleri sade deneyimlere dönüştürüyoruz. İşinize özel yazılımı strateji, tasarım ve mühendislikle bir araya getiriyoruz.</p>
              <div className="landing-hero-actions">
                <Link href={quoteHref} className="landing-button landing-button-light">Projenizi konuşalım <span><ArrowUpRight aria-hidden /></span></Link>
                <Link href="#calismalar" className="landing-text-link">Neler yapıyoruz? <ArrowDown aria-hidden /></Link>
              </div>
            </div>
            <HeroArtwork />
            <div className="landing-hero-bottom">
              <p>İşinizi anlayan bir ekip.<br /><span>Sizinle büyüyen bir teknoloji.</span></p>
              <a href="#hizmetler" className="landing-scroll-link" aria-label="Hizmetleri keşfet"><span>Keşfetmek için kaydırın</span><ArrowDown aria-hidden /></a>
            </div>
          </div>
        </section>

        <section className="landing-tech" aria-label="Kullandığımız teknolojiler">
          <div className="landing-shell landing-tech-inner">
            <p>Güçlü fikirlerin<br /><strong>sağlam bir temeli olur.</strong></p>
            <div>{techNames.map((tech) => <span key={tech.id}>{tech.name}</span>)}</div>
          </div>
        </section>

        <section id="hizmetler" className="landing-services landing-light" aria-labelledby="services-title">
          <div className="landing-shell">
            <div className="landing-section-heading">
              <div><p className="landing-kicker">Neler yapıyoruz?</p><h2 id="services-title">İşinizin bir sonraki adımı.<br />Birlikte tasarlayalım.</h2></div>
              <p>Hazır kalıplara sığmayan fikirler için buradayız. İhtiyacınıza odaklanan, birbiriyle uyum içinde çalışan dijital çözümler geliştiriyoruz.</p>
            </div>
            <div className="landing-services-grid">
              {services.slice(0, 6).map((service, i) => (
                <Link className={`landing-service-card landing-service-${i % 3}`} href={`/hizmetler/${service.slug}`} key={service.slug}>
                  <div className="landing-service-top"><ServiceIcon name={service.icon} className="size-6" /><ArrowUpRight className="landing-card-arrow" aria-hidden /></div>
                  <div className="landing-service-illustration" aria-hidden="true"><span /><span /><span /><i /><i /></div>
                  <h3>{service.title}</h3><p>{service.summary}</p>
                  <span className="landing-card-link">Çözümü keşfedin <ArrowUpRight aria-hidden /></span>
                </Link>
              ))}
            </div>
            {services.length === 0 && <p className="landing-empty">Yeni çözümler üzerinde çalışıyoruz. İhtiyacınızı birlikte değerlendirelim.</p>}
          </div>
        </section>

        <section id="calismalar" className="landing-work" aria-labelledby="work-title">
          <div className="landing-shell">
            <div className="landing-section-heading">
              <div><p className="landing-kicker">Seçili çalışmalar</p><h2 id="work-title">Fikirden fazlası.<br />Gerçek bir dönüşüm.</h2></div>
              <Link href="/projeler" className="landing-outline-link">Tüm projeler <ArrowUpRight aria-hidden /></Link>
            </div>
            <div className="landing-project-grid">
              {projectCards.map((project) => (
                <Link href={`/projeler/${project.slug}`} className="landing-project-card" key={project.slug}>
                  <div className="landing-project-media">
                    {project.coverImage ? <Image src={project.coverImage.url} alt={project.coverImage.altText || project.title} fill sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1100px) 50vw, 760px" className="object-cover" /> : <div className="landing-project-fallback"><Code2 aria-hidden /></div>}
                    <span className="landing-project-category">{project.sector || "Özel yazılım"}</span>
                    <span className="landing-project-open"><ArrowUpRight aria-hidden /><span className="sr-only">Projeyi incele</span></span>
                  </div>
                  <div className="landing-project-info"><div><h3>{project.title}</h3><p>{project.summary}</p></div><span>{project.technologies.slice(0, 2).join(" / ")}</span></div>
                </Link>
              ))}
            </div>
            {projects.length === 0 && <p className="landing-empty">Yeni çalışmalarımızı yakında burada paylaşacağız.</p>}
          </div>
        </section>

        <section className="landing-approach landing-light" aria-labelledby="approach-title">
          <div className="landing-shell landing-approach-grid">
            <div className="landing-approach-intro">
              <p className="landing-kicker">Nasıl çalışıyoruz?</p><h2 id="approach-title">Aynı masada.<br />Aynı hedefe.</h2>
              <p>Bir yazılım teslim etmekten fazlasına inanıyoruz. Doğru soruları soran, sorumluluk alan ve yol boyunca yanınızda olan bir teknoloji ortağıyız.</p>
              <Link href="/kurumsal/hakkimizda" className="landing-dark-link">Veykivo’yu tanıyın <ArrowUpRight aria-hidden /></Link>
              <div className="landing-team-image"><Image src="/images/home/team-collaboration.webp" alt="Aydınlık bir ofiste dizüstü bilgisayar ve arayüz taslakları üzerinde birlikte çalışan yazılım ekibi" fill sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1100px) 45vw, 640px" className="object-cover" /></div>
            </div>
            <ol className="landing-process">
              {process.map((step, i) => <li key={step.title}><span className="landing-step-index">0{i + 1}</span><div><step.icon aria-hidden /><h3>{step.title}</h3><p>{step.body}</p></div></li>)}
            </ol>
          </div>
        </section>

        {posts.items.length > 0 && <section className="landing-insights landing-light" aria-labelledby="insights-title">
          <div className="landing-shell">
            <div className="landing-section-heading"><div><p className="landing-kicker">Notlarımızdan</p><h2 id="insights-title">Bakış açımızı paylaşıyoruz.</h2></div><Link href="/blog" className="landing-dark-link">Tüm yazılar <ArrowUpRight aria-hidden /></Link></div>
            <div className="landing-insights-grid">
              {postCards.map((post) => <Link href={`/blog/${post.slug}`} className="landing-post" key={post.slug}>
                <div className="landing-post-image">{post.coverImage && <Image src={post.coverImage.url} alt={post.coverImage.altText || post.title} fill sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1100px) 33vw, 450px" className="object-cover" />}<ArrowUpRight aria-hidden /></div>
                <p className="landing-post-meta"><time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time><span>{post.readingMinutes} dk okuma</span></p>
                <h3>{post.title}</h3>
              </Link>)}
            </div>
          </div>
        </section>}

        <section className="landing-contact" aria-labelledby="contact-title">
          <div className="landing-contact-orbit" aria-hidden="true" />
          <div className="landing-shell">
            <p className="landing-kicker">Sıradaki iyi fikir sizin olabilir.</p><h2 id="contact-title">Birlikte bir şeyler<br />değiştirelim.</h2>
            <p>Bir fikriniz, bir sorunuz ya da çözülmeyi bekleyen bir süreciniz mi var?<br className="hidden sm:block" /> İlk adımı birlikte atalım.</p>
            <Link href={quoteHref} className="landing-button landing-button-light">Tanışalım <span><ArrowUpRight aria-hidden /></span></Link>
            <div className="landing-contact-notes"><span><Check aria-hidden /> Önce ihtiyacınızı anlarız</span><span><Check aria-hidden /> Birlikte yol haritası çıkarırız</span></div>
          </div>
        </section>
      </LandingMotion>
    </>
  );
}
