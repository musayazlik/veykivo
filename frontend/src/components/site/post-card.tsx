import Link from "next/link";
import type { CategoryRef, PostListItem } from "@/lib/api/types";
import { ContentImage } from "./content-image";
import { formatDate } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Renkli nokta + ad; kategori arşivine bağlanır. Kartın tamamı tıklanabilir olduğu için z-index ile öne alınır. */
export function CategoryBadge({ category, className }: { category: CategoryRef; className?: string }) {
  return (
    <Link
      href={`/blog/kategori/${category.slug}`}
      className={cn("relative z-10 inline-flex items-center gap-2 text-sm font-semibold text-ink/80 hover:text-ink", className)}
    >
      <span aria-hidden className="size-2 rounded-full" style={{ background: category.color }} />
      {category.name}
    </Link>
  );
}

export function PostMeta({ post, className }: { post: Pick<PostListItem, "publishedAt" | "readingMinutes">; className?: string }) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      <span className="mx-2 text-line" aria-hidden>
        /
      </span>
      {post.readingMinutes} dk okuma
    </p>
  );
}

export function PostCard({ post, headingLevel = "h3" }: { post: PostListItem; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="group relative flex flex-col">
      <ContentImage
        media={post.coverImage}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="aspect-[16/10] rounded-sm"
        fallbackLabel={post.title}
      />
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1">
        {post.category && <CategoryBadge category={post.category} />}
        <PostMeta post={post} />
      </div>
      <Heading className="mt-2 text-[1.3rem] leading-snug font-bold tracking-[-0.01em] text-ink">
        <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
          {post.title}
        </Link>
      </Heading>
      <p className="mt-2 text-muted-foreground">{post.excerpt}</p>
    </article>
  );
}
