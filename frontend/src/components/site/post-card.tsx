import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CategoryRef, PostListItem } from "@/lib/api/types";
import { ContentImage } from "./content-image";
import { formatDate } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Renkli nokta + ad; kategori arşivine bağlanır. Kartın tamamı tıklanabilir olduğu için z-index ile öne alınır. */
export function CategoryBadge({ category, className }: { category: CategoryRef; className?: string }) {
  return (
    <Link
      href={`/blog/kategori/${category.slug}`}
      className={cn("relative z-10 inline-flex items-center gap-2 text-sm font-semibold text-[#6a7ba6] transition-colors hover:text-[#3d56c9]", className)}
    >
      <span aria-hidden className="size-2 rounded-full" style={{ background: category.color }} />
      {category.name}
    </Link>
  );
}

export function PostMeta({ post, className }: { post: Pick<PostListItem, "publishedAt" | "readingMinutes">; className?: string }) {
  return (
    <p className={cn("text-sm text-[#646a7c]", className)}>
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      <span className="mx-2 text-[#c9cdd9]" aria-hidden>
        /
      </span>
      {post.readingMinutes} dk okuma
    </p>
  );
}

/** Blog listelemelerinde kullanılan kart; ana sayfadaki yazı kartlarıyla aynı dilde. */
export function PostCard({ post, headingLevel = "h3" }: { post: PostListItem; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="landing-post group relative flex flex-col">
      <Link href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden="true" className="landing-post-image block">
        <ContentImage
          media={post.coverImage}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="h-full"
          fallbackLabel={post.title}
        />
        <ArrowUpRight aria-hidden />
      </Link>
      <p className="landing-post-meta">
        {post.category ? (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full" style={{ background: post.category.color }} />
            {post.category.name}
          </span>
        ) : (
          <span>Veykivo</span>
        )}
        <span className="inline-flex items-center gap-2">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} dk</span>
        </span>
      </p>
      <Heading>
        <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 hover:text-[#3d56c9]">
          {post.title}
        </Link>
      </Heading>
      <p className="mt-3 text-[13.5px] leading-relaxed text-[#626a7c]">{post.excerpt}</p>
    </article>
  );
}
