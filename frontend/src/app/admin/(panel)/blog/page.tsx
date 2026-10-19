"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleOff, ExternalLink, MessageSquare, Pencil, Send, Star, StarOff, Trash2 } from "lucide-react";
import { adminApi, unwrap } from "@/lib/api/browser";
import type { AdminPostListItem } from "@/lib/api/types";
import { EmptyState, ErrorState, PageHeader, StatGrid, formatDateTime } from "@/components/admin/ui";
import { DataTable, columnHelperFor, type Facet } from "@/components/admin/data-table";
import { useContentMutation } from "@/components/admin/use-save";
import { useDeleteConfirm } from "@/components/admin/use-delete-confirm";
import { PostStatusBadge, postStateOf } from "@/components/admin/editors/post-status";

const listKey = ["admin", "posts"];
const col = columnHelperFor<AdminPostListItem>();
const columns = col.columns([
  col.accessor("title", {
    header: "Yazı",
    cell: ({ row }) => {
      const p = row.original;
      return (
        <Link href={`/admin/blog/${p.id}`} className="group flex items-center gap-3">
          <span className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-mist text-sm font-bold text-muted-foreground">
            {p.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.coverImage.url} alt="" className="size-full object-cover" />
            ) : (
              p.title.charAt(0)
            )}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 font-medium text-ink group-hover:underline">
              <span className="line-clamp-1">{p.title}</span>
              {p.isFeatured && <Star aria-label="Öne çıkan" className="size-3.5 shrink-0 fill-signal text-signal" />}
            </span>
            <span className="block truncate text-xs text-muted-foreground">/blog/{p.slug}</span>
          </span>
        </Link>
      );
    },
  }),
  col.accessor((p) => p.categoryId ?? "none", {
    id: "category",
    header: "Kategori",
    filterFn: "inArray",
    cell: ({ row }) =>
      row.original.category ? (
        <span className="inline-flex items-center gap-2 text-sm whitespace-nowrap">
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: row.original.category.color }} />
          {row.original.category.name}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
  }),
  col.accessor((p) => p.tags.map((t) => t.slug), {
    id: "tags",
    header: "Etiketler",
    filterFn: "inArray",
    enableSorting: false,
    cell: ({ row }) => {
      const tags = row.original.tags;
      return tags.length === 0 ? (
        <span className="text-sm text-muted-foreground">—</span>
      ) : (
        <span className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((t) => (
            <span key={t.slug} className="rounded-full bg-mist px-2 py-0.5 text-xs text-ink/80">
              {t.name}
            </span>
          ))}
          {tags.length > 3 && <span className="rounded-full px-1.5 py-0.5 text-xs text-muted-foreground">+{tags.length - 3}</span>}
        </span>
      );
    },
  }),
  col.accessor((p) => postStateOf(p.status, p.publishedAt), {
    id: "status",
    header: "Durum",
    filterFn: "inArray",
    cell: ({ row }) => (
      <span className="flex flex-col items-start gap-0.5">
        <PostStatusBadge status={row.original.status} publishedAt={row.original.publishedAt} />
        {row.original.isScheduled && <span className="text-xs text-muted-foreground">{formatDateTime(row.original.publishedAt)}</span>}
      </span>
    ),
  }),
  col.accessor("commentCount", {
    header: "Yorum",
    cell: ({ row }) => (
      <Link href={`/admin/blog/yorumlar`} className="inline-flex items-center gap-1.5 text-sm tabular-nums text-ink/80 hover:text-ink">
        <MessageSquare aria-hidden className="size-3.5" />
        {row.original.commentCount}
        {row.original.pendingCommentCount > 0 && (
          <span className="rounded-full bg-signal px-1.5 text-xs font-bold text-ink">{row.original.pendingCommentCount}</span>
        )}
      </Link>
    ),
  }),
  col.accessor("updatedAt", {
    header: "Güncellendi",
    cell: (c) => <span className="text-sm whitespace-nowrap text-muted-foreground">{formatDateTime(c.getValue())}</span>,
  }),
]);

export default function PostsAdminPage() {
  const posts = useQuery({ queryKey: listKey, queryFn: () => unwrap(adminApi.GET("/api/v1/admin/posts")) });
  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: () => unwrap(adminApi.GET("/api/v1/admin/categories")) });
  const tags = useQuery({ queryKey: ["admin", "tags"], queryFn: () => unwrap(adminApi.GET("/api/v1/admin/tags")) });

  const quick = useContentMutation({
    mutationFn: ({ post, status, isFeatured }: { post: AdminPostListItem; status?: "Draft" | "Published"; isFeatured?: boolean }) =>
      unwrap(
        adminApi.PATCH("/api/v1/admin/posts/{id}", {
          params: { path: { id: post.id } },
          body: { status: status ?? null, isFeatured: isFeatured ?? null, version: post.version },
        }),
      ),
    queryKey: listKey,
    tags: ["posts"],
    successMessage: "Yazı güncellendi.",
  });
  const remove = useContentMutation({
    mutationFn: (p: AdminPostListItem) => unwrap(adminApi.DELETE("/api/v1/admin/posts/{id}", { params: { path: { id: p.id } } })),
    queryKey: listKey,
    tags: ["posts"],
    successMessage: "Yazı silindi.",
  });
  const { request: askDelete, dialog: deleteDialog } = useDeleteConfirm<AdminPostListItem>({
    name: (p) => p.title,
    onDelete: (p) => remove.mutateAsync(p),
    description: "Yazı ve yorumları kalıcı olarak silinir. Yalnızca yayından kaldırmak istiyorsanız taslağa alın.",
  });
  const quickUpdate = quick.mutate;

  const rowActions = useMemo(
    () => (p: AdminPostListItem) => [
      { label: "Düzenle", icon: Pencil, href: `/admin/blog/${p.id}` },
      ...(p.status === "Published" && !p.isScheduled ? [{ label: "Sitede gör", icon: ExternalLink, externalHref: `/blog/${p.slug}` }] : []),
      p.status === "Draft"
        ? { label: "Yayınla", icon: Send, separatorBefore: true, onSelect: () => quickUpdate({ post: p, status: "Published" }) }
        : { label: "Taslağa al", icon: CircleOff, separatorBefore: true, onSelect: () => quickUpdate({ post: p, status: "Draft" }) },
      p.isFeatured
        ? { label: "Öne çıkarmayı kaldır", icon: StarOff, onSelect: () => quickUpdate({ post: p, isFeatured: false }) }
        : { label: "Öne çıkar", icon: Star, onSelect: () => quickUpdate({ post: p, isFeatured: true }) },
      { label: "Sil", icon: Trash2, destructive: true, separatorBefore: true, onSelect: () => askDelete(p) },
    ],
    [askDelete, quickUpdate],
  );

  const facets = useMemo<Facet[]>(
    () => [
      {
        columnId: "status",
        title: "Durum",
        options: [
          { value: "published", label: "Yayında" },
          { value: "scheduled", label: "Planlandı" },
          { value: "draft", label: "Taslak" },
        ],
      },
      {
        columnId: "category",
        title: "Kategori",
        options: [
          ...(categories.data ?? []).map((c) => ({ value: c.id, label: c.name, color: c.color })),
          { value: "none", label: "Kategorisiz" },
        ],
      },
      { columnId: "tags", title: "Etiket", options: (tags.data ?? []).map((t) => ({ value: t.slug, label: t.name })) },
    ],
    [categories.data, tags.data],
  );

  const data = posts.data ?? [];
  const states = data.map((p) => postStateOf(p.status, p.publishedAt));
  const pendingComments = data.reduce((sum, p) => sum + p.pendingCommentCount, 0);

  return (
    <>
      <PageHeader title="Yazılar" description="Blog yazıları, planlanmış yayınlar ve taslaklar." newHref="/admin/blog/yeni" newLabel="Yeni yazı" />
      <StatGrid
        items={[
          { label: "Toplam yazı", value: data.length },
          { label: "Yayında", value: states.filter((s) => s === "published").length },
          { label: "Planlandı", value: states.filter((s) => s === "scheduled").length, hint: "Zamanı gelince kendiliğinden yayınlanır" },
          { label: "Onay bekleyen yorum", value: pendingComments, tone: pendingComments > 0 ? "signal" : "default" },
        ]}
      />
      {posts.isError ? (
        <ErrorState message="Yazılar yüklenemedi." onRetry={() => posts.refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={posts.data}
          isLoading={posts.isLoading}
          searchPlaceholder="Başlık veya adres ara"
          searchText={(p) => `${p.title} ${p.slug} ${p.category?.name ?? ""} ${p.tags.map((t) => t.name).join(" ")}`}
          facets={facets}
          rowActions={rowActions}
          emptyState={<EmptyState title="Henüz yazı yok" text="İlk blog yazınızı oluşturun veya yapay zekâ ile bir taslak hazırlayın." href="/admin/blog/yeni" cta="Yeni yazı" />}
        />
      )}
      {deleteDialog}
    </>
  );
}
