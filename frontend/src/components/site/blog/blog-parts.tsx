import Link from "next/link";
import { Search } from "lucide-react";
import type { BlogCategory, PostListItem } from "@/lib/api/types";
import { ContentImage } from "../content-image";
import { CategoryBadge, PostCard, PostMeta } from "../post-card";
import { RevealMask } from "../reveal";

/** Kategori şeridi ve arama: blog ana sayfası ve arşiv sayfalarında ortak. */
export function BlogNav({ categories, active, search }: { categories: BlogCategory[]; active?: string; search?: string }) {
  const total = categories.reduce((sum, c) => sum + c.postCount, 0);
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <nav aria-label="Blog kategorileri" className="-mx-1 overflow-x-auto">
        <ul className="flex gap-2 px-1 whitespace-nowrap">
          <li>
            <Chip href="/blog" active={!active}>
              Tümü <span className="text-xs opacity-60 tabular-nums">{total}</span>
            </Chip>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Chip href={`/blog/kategori/${c.slug}`} active={active === c.slug}>
                <span aria-hidden className="size-2 rounded-full" style={{ background: c.color }} />
                {c.name}
                <span className="text-xs opacity-60 tabular-nums">{c.postCount}</span>
              </Chip>
            </li>
          ))}
        </ul>
      </nav>
      <form action="/blog" role="search" className="relative w-full lg:w-72">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#9aa0b0]" />
        <input
          type="search"
          name="ara"
          defaultValue={search}
          placeholder="Yazılarda ara"
          aria-label="Yazılarda ara"
          className="landing-input landing-input-pill pr-4 pl-11"
        />
      </form>
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className="landing-chip">
      {children}
    </Link>
  );
}

/** Öne çıkan yazı: blogun ilk sayfasında, listenin üstünde geniş kart. */
export function FeaturedPost({ post }: { post: PostListItem }) {
  return (
    <article className="group relative grid items-center gap-10 md:grid-cols-12 md:gap-14">
      <RevealMask className="md:col-span-7">
        <ContentImage media={post.coverImage} sizes="(min-width: 768px) 58vw, 100vw" priority className="rounded-2xl aspect-[16/10]" fallbackLabel={post.title} />
      </RevealMask>
      <div className="md:col-span-5">
        <p className="inline-flex items-center gap-2 rounded-full bg-[#141722] px-3.5 py-1.5 text-[11px] font-semibold text-[#f5f6fb]">Öne çıkan yazı</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1">
          {post.category && <CategoryBadge category={post.category} />}
          <PostMeta post={post} />
        </div>
        <h2 className="mt-3 text-[clamp(24px,2.4vw,36px)] leading-[1.2] tracking-[-0.03em]">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 hover:text-[#3d56c9]">
            {post.title}
          </Link>
        </h2>
        <p className="mt-4 text-[15px] leading-[1.8] text-[#626a7c]">{post.excerpt}</p>
      </div>
    </article>
  );
}

export function PostGrid({ posts }: { posts: PostListItem[] }) {
  return (
    <div className="landing-insights-grid">
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} headingLevel="h2" />
      ))}
    </div>
  );
}

/** Sorgu parametrelerini koruyarak sayfalama bağlantıları üretir. */
export function BlogPagination({ page, totalPages, basePath, params = {} }: { page: number; totalPages: number; basePath: string; params?: Record<string, string | undefined> }) {
  if (totalPages <= 1) return null;
  const href = (n: number) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    if (n > 1) q.set("sayfa", String(n));
    return q.size ? `${basePath}?${q}` : basePath;
  };
  return (
    <nav aria-label="Sayfalama" className="landing-pagination">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <Link key={n} href={href(n)} aria-current={n === page ? "page" : undefined}>
          {n}
        </Link>
      ))}
    </nav>
  );
}

export function PostGridSkeleton() {
  return (
    <div aria-busy="true" className="landing-insights-grid animate-pulse">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i}>
          <div className="h-[220px] rounded-xl bg-[#e3e7ef]" />
          <div className="mt-5 h-3.5 w-32 rounded bg-[#e3e7ef]" />
          <div className="mt-3 h-6 w-4/5 rounded bg-[#e3e7ef]" />
        </div>
      ))}
    </div>
  );
}

export function pageFrom(raw: string | string[] | undefined) {
  return Math.max(1, Number.parseInt(Array.isArray(raw) ? raw[0] : (raw ?? "1"), 10) || 1);
}
