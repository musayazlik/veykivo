import type { PostStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export type PostState = "draft" | "scheduled" | "published";

/** Yayında + ileri tarihli yazı "planlı" sayılır (API tarafındaki görünürlük kuralıyla aynı). */
export function postStateOf(status: PostStatus, publishedAt: string | null): PostState {
  if (status === "Draft") return "draft";
  return publishedAt && new Date(publishedAt) > new Date() ? "scheduled" : "published";
}

const labels: Record<PostState, string> = { draft: "Taslak", scheduled: "Planlandı", published: "Yayında" };
const styles: Record<PostState, string> = {
  draft: "bg-mist text-muted-foreground",
  scheduled: "bg-signal/25 text-ink",
  published: "bg-teal/10 text-teal",
};

export function PostStatusBadge({ status, publishedAt }: { status: PostStatus; publishedAt: string | null }) {
  const state = postStateOf(status, publishedAt);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", styles[state])}>
      <span aria-hidden className={cn("size-1.5 rounded-full", state === "published" ? "bg-teal" : state === "scheduled" ? "bg-signal-strong" : "bg-muted-foreground/60")} />
      {labels[state]}
    </span>
  );
}
