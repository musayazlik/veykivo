import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHero } from "@/components/site/page-hero";
import { BlogNav, BlogPagination, PostGrid, PostGridSkeleton, pageFrom } from "@/components/site/blog/blog-parts";
import { getBlogCategories, getBlogTags, getPosts } from "@/lib/api/content";

const PAGE_SIZE = 9;

export async function generateStaticParams() {
  const tags = await getBlogTags();
  return tags.length > 0 ? tags.map((t) => ({ slug: t.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/etiket/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tag = (await getBlogTags()).find((t) => t.slug === slug);
  if (!tag) return { title: "Etiket bulunamadı", robots: { index: false } };
  // Etiket arşivleri ince içerik olabilir; taranır ama dizine eklenmez.
  return { title: `#${tag.name}`, description: `“${tag.name}” etiketli blog yazıları.`, robots: { index: false, follow: true } };
}

export default function TagArchivePage(props: PageProps<"/blog/etiket/[slug]">) {
  return (
    <Suspense fallback={<div className="container-x pt-[calc(var(--header-h)+3.5rem)] pb-24"><PostGridSkeleton /></div>}>
      <TagArchive params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function TagArchive({ params, searchParams }: Pick<PageProps<"/blog/etiket/[slug]">, "params" | "searchParams">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [tags, categories] = await Promise.all([getBlogTags(), getBlogCategories()]);
  const tag = tags.find((t) => t.slug === slug);
  if (!tag) notFound();

  const page = pageFrom(sp.sayfa);
  const result = await getPosts({ page, pageSize: PAGE_SIZE, tag: slug });

  return (
    <>
      <PageHero
        title={`#${tag.name}`}
        lead={`“${tag.name}” etiketiyle işaretlenmiş ${tag.postCount} yazı.`}
        crumbs={[{ label: "Blog", href: "/blog" }, { label: tag.name }]}
      />
      <section className="container-x pb-24">
        <BlogNav categories={categories} />
        <div className="mt-12">
          <PostGrid posts={result.items} />
        </div>
        <BlogPagination page={page} totalPages={result.totalPages ?? 0} basePath={`/blog/etiket/${slug}`} />
      </section>
    </>
  );
}
