import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHero } from "@/components/site/page-hero";
import { BlogNav, BlogPagination, PostGrid, PostGridSkeleton, pageFrom } from "@/components/site/blog/blog-parts";
import { getBlogCategories, getPosts, slugParams } from "@/lib/api/content";

const PAGE_SIZE = 9;

export function generateStaticParams() {
  return slugParams("category");
}

export async function generateMetadata({ params }: PageProps<"/blog/kategori/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getBlogCategories()).find((c) => c.slug === slug);
  if (!category) return { title: "Kategori bulunamadı", robots: { index: false } };
  return {
    title: `${category.name} yazıları`,
    description: category.description ?? `${category.name} kategorisindeki blog yazıları.`,
    alternates: { canonical: `/blog/kategori/${slug}` },
  };
}

export default function CategoryArchivePage(props: PageProps<"/blog/kategori/[slug]">) {
  return (
    <Suspense fallback={<div className="page-body"><div className="landing-shell"><PostGridSkeleton /></div></div>}>
      <CategoryArchive params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function CategoryArchive({ params, searchParams }: Pick<PageProps<"/blog/kategori/[slug]">, "params" | "searchParams">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const categories = await getBlogCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const page = pageFrom(sp.sayfa);
  const result = await getPosts({ page, pageSize: PAGE_SIZE, category: slug });

  return (
    <>
      <PageHero
        title={category.name}
        lead={category.description ?? `${category.name} üzerine yazdıklarımız.`}
        crumbs={[{ label: "Blog", href: "/blog" }, { label: category.name }]}
      >
        <p className="mt-7 inline-flex items-center gap-2.5 text-[13px] font-medium text-[#9aa3ba]">
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: category.color }} />
          {category.postCount} yazı
        </p>
      </PageHero>
      <section className="page-body">
        <div className="landing-shell">
          <BlogNav categories={categories} active={slug} />
          <div className="mt-14">
            <PostGrid posts={result.items} />
          </div>
          <BlogPagination page={page} totalPages={result.totalPages ?? 0} basePath={`/blog/kategori/${slug}`} />
        </div>
      </section>
    </>
  );
}
