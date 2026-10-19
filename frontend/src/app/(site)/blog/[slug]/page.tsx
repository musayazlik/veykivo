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
        <header className="container-x pt-[calc(var(--header-h)+3.5rem)] pb-12">
          <div className="mx-auto max-w-3xl">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-ink">
              <ArrowLeft aria-hidden className="size-4" />
              Tüm yazılar
            </Link>
            <div className="hero-rise">
              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1">
                {post.category && <CategoryBadge category={post.category} />}
                <PostMeta post={post} />
              </div>
              <h1 className="mt-4 text-h1 text-ink">{post.title}</h1>
              <p className="mt-6 text-lead text-muted-foreground">{post.excerpt}</p>
              <p className="mt-6 flex items-center gap-3 text-sm">
                <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-ink font-bold text-signal">
                  {(post.authorName ?? "V").charAt(0)}
                </span>
                <span>
                  <span className="block font-semibold text-ink">{post.authorName ?? "Veykivo Editör"}</span>
                  <span className="block text-muted-foreground">Veykivo</span>
                </span>
              </p>
            </div>
          </div>
        </header>

        <div className="container-x">
          <ContentImage
            media={post.coverImage}
            sizes="(min-width: 1280px) 1200px, 100vw"
            priority
            className="notch mx-auto aspect-[16/9] max-w-5xl"
            fallbackLabel={post.title}
          />
        </div>

        <div className="container-x grid gap-16 py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-14 xl:max-w-[72rem]">
          <div className="min-w-0">
            <Markdown className="max-w-3xl text-[1.125rem] leading-[1.8]">{post.bodyMarkdown}</Markdown>

            {post.tags.length > 0 && (
              <ul aria-label="Etiketler" className="mt-12 flex max-w-3xl flex-wrap gap-2 border-t border-line pt-6">
                {post.tags.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/blog/etiket/${t.slug}`}
                      className="inline-flex items-center gap-1 rounded-full border border-line bg-white py-1 pr-3 pl-2 text-sm text-ink/85 transition-colors hover:border-ink/40 hover:text-ink"
                    >
                      <Hash aria-hidden className="size-3.5 text-muted-foreground" />
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
                <h2 className="font-bold text-ink">Kategoriler</h2>
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/blog/kategori/${c.slug}`} className="flex items-center gap-2.5 py-2.5 text-[0.95rem] text-ink/85 hover:text-ink">
                        <span aria-hidden className="size-2 rounded-full" style={{ background: c.color }} />
                        <span className="flex-1">{c.name}</span>
                        <span className="text-sm text-muted-foreground tabular-nums">{c.postCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {others.length > 0 && (
              <nav aria-label="Son yazılar">
                <h2 className="font-bold text-ink">Son yazılar</h2>
                <ul className="mt-3 space-y-4">
                  {others.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/blog/${p.slug}`} className="group block">
                        <span className="block leading-snug font-semibold text-ink group-hover:underline group-hover:underline-offset-4">{p.title}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">{formatDate(p.publishedAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </aside>
        </div>
      </article>

      <CtaBand
        title="Bu konuyu kendi işiniz için konuşalım."
        text="Yazıda anlattığımız yaklaşımın sizin süreçlerinizde nasıl uygulanabileceğini birlikte değerlendirelim."
      />
    </>
  );
}
