import { JsonLd } from "@/components/site/json-ld";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Hash } from "lucide-react";
import { ContentImage } from "@/components/site/content-image";
import { Markdown } from "@/components/site/markdown";
import { DetailSkeleton } from "@/components/site/detail-skeleton";
import { CtaBand } from "@/components/site/cta-band";
import { CategoryBadge, PostMeta } from "@/components/site/post-card";
import { CommentsSection } from "@/components/site/blog/comments";
import { getBlogCategories, getPost, getPosts, slugParams } from "@/lib/api/content";
import { formatDate, siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return slugParams("post");
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Yazı bulunamadı", robots: { index: false } };
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: post.authorName ? [post.authorName] : undefined,
      tags: post.tags.map((t) => t.name),
      images: post.coverImage ? [{ url: post.coverImage.url, alt: post.coverImage.altText }] : undefined,
    },
  };
}

export default function PostPage(props: PageProps<"/blog/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <PostDetail params={props.params} />
    </Suspense>
  );
}

async function PostDetail({ params }: Pick<PageProps<"/blog/[slug]">, "params">) {
  const { slug } = await params;
  const [post, categories, recent] = await Promise.all([getPost(slug), getBlogCategories(), getPosts({ pageSize: 5 })]);
  if (!post) notFound();
  const others = recent.items.filter((p) => p.slug !== slug).slice(0, 4);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: { "@type": post.authorName ? "Person" : "Organization", name: post.authorName ?? "Veykivo" },
      articleSection: post.category?.name,
      keywords: post.tags.map((t) => t.name).join(", ") || undefined,
      commentCount: post.commentCount,
      image: post.coverImage ? `${siteUrl}${post.coverImage.url}` : undefined,
      mainEntityOfPage: `${siteUrl}/blog/${slug}`,
      publisher: { "@type": "Organization", name: "Veykivo", url: siteUrl },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Blog", item: `${siteUrl}/blog` },
        ...(post.category
          ? [{ "@type": "ListItem", position: 2, name: post.category.name, item: `${siteUrl}/blog/kategori/${post.category.slug}` }]
          : []),
        { "@type": "ListItem", position: post.category ? 3 : 2, name: post.title },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <article>
        <header className="page-hero page-hero--article">
          <div className="page-hero-glow" aria-hidden="true" />
          <div className="landing-shell">
            <div className="mx-auto max-w-3xl">
              <Link href="/blog" className="landing-back-link">
                <ArrowLeft aria-hidden /> Tüm yazılar
              </Link>
              <div className="hero-rise">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
                  {post.category && <CategoryBadge category={post.category} className="text-[#a9b7e8] hover:text-white" />}
                  <PostMeta post={post} className="text-[#9aa3ba]" />
                </div>
                <h1 className="mt-5">{post.title}</h1>
                <p className="page-lead">{post.excerpt}</p>
                <p className="mt-8 flex items-center gap-3.5">
                  <span aria-hidden className="grid size-10 place-items-center rounded-full bg-[#141722] text-[15px] font-semibold text-[#a1b7ff]">
                    {(post.authorName ?? "V").charAt(0)}
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-[#e8eaf3]">{post.authorName ?? "Veykivo Editör"}</span>
                    <span className="block text-[12px] text-[#747a8f]">Veykivo</span>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="page-body">
          <div className="landing-shell">
            <ContentImage
              media={post.coverImage}
              sizes="(min-width: 1280px) 1200px, 100vw"
              priority
              className="mx-auto aspect-[16/9] max-w-5xl rounded-2xl"
              fallbackLabel={post.title}
            />

            <div className="mx-auto mt-16 grid max-w-5xl gap-16 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-14">
              <div className="min-w-0">
                <Markdown className="max-w-3xl text-[1.05rem]">{post.bodyMarkdown}</Markdown>

                {post.tags.length > 0 && (
                  <ul aria-label="Etiketler" className="mt-14 flex max-w-3xl flex-wrap gap-2 border-t border-[#e0e3ee] pt-7">
                    {post.tags.map((t) => (
                      <li key={t.slug}>
                        <Link href={`/blog/etiket/${t.slug}`} className="landing-chip landing-chip-sm">
                          <Hash aria-hidden className="size-3.5 text-[#9aa0b0]" />
                          {t.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                <CommentsSection postSlug={post.slug} comments={post.comments} count={post.commentCount} />
              </div>

              <aside className="space-y-10 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
                {categories.length > 0 && (
                  <nav aria-label="Kategoriler">
                    <h2 className="text-[0.7rem] font-semibold tracking-[0.08em] text-[#878da0] uppercase">Kategoriler</h2>
                    <ul className="landing-side-list mt-3">
                      {categories.map((c) => (
                        <li key={c.slug}>
                          <Link href={`/blog/kategori/${c.slug}`}>
                            <span aria-hidden className="size-2 rounded-full" style={{ background: c.color }} />
                            <span className="flex-1">{c.name}</span>
                            <span className="text-[13px] text-[#878da0] tabular-nums">{c.postCount}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
                {others.length > 0 && (
                  <nav aria-label="Son yazılar">
                    <h2 className="text-[0.7rem] font-semibold tracking-[0.08em] text-[#878da0] uppercase">Son yazılar</h2>
                    <ul className="mt-3">
                      {others.map((p) => (
                        <li key={p.slug} className="border-t border-[#ebedf5] first:border-t-0">
                          <Link href={`/blog/${p.slug}`} className="group block py-3.5">
                            <span className="block text-[14px] leading-snug font-semibold text-[#2a2e3c] group-hover:text-[#3d56c9]">{p.title}</span>
                            <span className="mt-1 block text-[12px] text-[#878da0]">{formatDate(p.publishedAt)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
              </aside>
            </div>
          </div>
        </div>
      </article>

      <CtaBand
        title="Bu konuyu kendi işiniz için konuşalım."
        text="Yazıda anlattığımız yaklaşımın sizin süreçlerinizde nasıl uygulanabileceğini birlikte değerlendirelim."
      />
    </>
  );
}
