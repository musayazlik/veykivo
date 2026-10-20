import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/site/page-hero";
import { BlogNav, BlogPagination, FeaturedPost, PostGrid, PostGridSkeleton, pageFrom } from "@/components/site/blog/blog-parts";
import { getBlogCategories, getPosts } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Blog",
  description: "Kurumsal yazılım, ERP, dijital dönüşüm ve yapay zekâ üzerine pratik yazılar.",
  alternates: { canonical: "/blog" },
};

const PAGE_SIZE = 9;

export default async function BlogPage(props: PageProps<"/blog">) {
  const categories = await getBlogCategories();
  return (
    <>
      <PageHero
        title="Notlarımızdan"
        lead="Projelerimizden öğrendiklerimizi, karar vermenizi kolaylaştıracak pratik yazılara dönüştürüyoruz."
        crumbs={[{ label: "Blog" }]}
      />
      <section className="page-body">
        <div className="landing-shell">
          <Suspense fallback={<><BlogNav categories={categories} /><div className="mt-14"><PostGridSkeleton /></div></>}>
            <BlogListing searchParams={props.searchParams} categories={categories} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

async function BlogListing({
  searchParams,
  categories,
}: Pick<PageProps<"/blog">, "searchParams"> & { categories: Awaited<ReturnType<typeof getBlogCategories>> }) {
  const sp = await searchParams;
  const page = pageFrom(sp.sayfa);
  const q = (Array.isArray(sp.ara) ? sp.ara[0] : sp.ara)?.trim() || undefined;

  // Öne çıkan yazı yalnızca ilk sayfada, arama yokken üstte büyük gösterilir ve listeden çıkarılır.
  const showFeatured = page === 1 && !q;
  const [featured, result] = await Promise.all([
    showFeatured ? getPosts({ featured: true, pageSize: 1 }) : Promise.resolve(null),
    getPosts({ page, pageSize: PAGE_SIZE, q }),
  ]);
  const hero = featured?.items[0];
  const items = hero ? result.items.filter((p) => p.slug !== hero.slug) : result.items;

  return (
    <>
      <BlogNav categories={categories} search={q} />
      {q && (
        <p className="mt-8 text-[14px] text-[#646a7c]" role="status">
          “{q}” için {result.totalCount} sonuç bulundu.
        </p>
      )}
      {hero && (
        <div className="mt-16 mb-20">
          <FeaturedPost post={hero} />
        </div>
      )}
      <div className="mt-14">
        {items.length === 0 && !hero ? (
          <p className="landing-empty">
            {q ? "Aramanıza uyan yazı bulunamadı. Farklı bir kelime deneyin." : "Bu sayfada henüz yazı yok."}
          </p>
        ) : (
          <PostGrid posts={items} />
        )}
      </div>
      <BlogPagination page={page} totalPages={result.totalPages ?? 0} basePath="/blog" params={{ ara: q }} />
    </>
  );
}
