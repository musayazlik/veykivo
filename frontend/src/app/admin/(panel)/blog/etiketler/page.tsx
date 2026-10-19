"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Hash, Pencil, Plus, Trash2 } from "lucide-react";
import { adminApi, unwrap } from "@/lib/api/browser";
import type { AdminTag } from "@/lib/api/types";
import { ErrorState, PageHeader, StatGrid, formatDateTime } from "@/components/admin/ui";
import { DataTable, columnHelperFor, type Facet } from "@/components/admin/data-table";
import { useContentMutation } from "@/components/admin/use-save";
import { useDeleteConfirm } from "@/components/admin/use-delete-confirm";
import { TagDialog, tagsKey } from "@/components/admin/blog/taxonomy-dialogs";
import { actionVariants } from "@/components/site/action-link";

const col = columnHelperFor<AdminTag>();
const columns = col.columns([
  col.accessor("name", {
    header: "Etiket",
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-mist py-1 pr-3 pl-2 text-sm font-medium text-ink">
        <Hash aria-hidden className="size-3.5 text-muted-foreground" />
        {row.original.name}
      </span>
    ),
  }),
  col.accessor("slug", { header: "Adres", cell: (c) => <span className="text-sm text-muted-foreground">/blog/etiket/{c.getValue()}</span> }),
  col.accessor("postCount", { header: "Yazı", cell: (c) => <span className="tabular-nums">{c.getValue()}</span> }),
  col.accessor((t) => (t.postCount > 0 ? "used" : "unused"), { id: "usage", header: "Kullanım", filterFn: "inArray", enableSorting: false, cell: (c) => (c.getValue() === "used" ? "Kullanılıyor" : "Kullanılmıyor") }),
  col.accessor("createdAt", {
    header: "Oluşturuldu",
    cell: (c) => <span className="text-sm whitespace-nowrap text-muted-foreground">{formatDateTime(c.getValue())}</span>,
  }),
]);

const facets: Facet[] = [
  { columnId: "usage", title: "Kullanım", options: [{ value: "used", label: "Kullanılıyor" }, { value: "unused", label: "Kullanılmıyor" }] },
];

export default function TagsPage() {
  const [editing, setEditing] = useState<AdminTag | "new" | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: tagsKey, queryFn: () => unwrap(adminApi.GET("/api/v1/admin/tags")) });

  const remove = useContentMutation({
    mutationFn: (t: AdminTag) => unwrap(adminApi.DELETE("/api/v1/admin/tags/{id}", { params: { path: { id: t.id } } })),
    queryKey: tagsKey,
    tags: ["posts"],
    successMessage: "Etiket silindi.",
  });
  const { request: askDelete, dialog: deleteDialog } = useDeleteConfirm<AdminTag>({
    name: (t) => t.name,
    onDelete: (t) => remove.mutateAsync(t),
    description: "Etiket yazılardan kaldırılır; yazılar silinmez.",
  });

  const rowActions = useMemo(
    () => (t: AdminTag) => [
      { label: "Düzenle", icon: Pencil, onSelect: () => setEditing(t) },
      ...(t.postCount > 0 ? [{ label: "Sitede gör", icon: ExternalLink, externalHref: `/blog/etiket/${t.slug}` }] : []),
      { label: "Sil", icon: Trash2, destructive: true, separatorBefore: true, onSelect: () => askDelete(t) },
    ],
    [askDelete],
  );

  const items = data ?? [];
  const top = [...items].sort((a, b) => b.postCount - a.postCount)[0];

  return (
    <>
      <PageHeader title="Etiketler" description="Yazıları ince konulara göre bağlayan etiketler." />
      <StatGrid
        items={[
          { label: "Toplam etiket", value: items.length },
          { label: "Etiket kullanımı", value: items.reduce((s, t) => s + t.postCount, 0) },
          { label: "En çok kullanılan", value: top?.postCount ?? 0, hint: top?.name },
          { label: "Kullanılmayan", value: items.filter((t) => t.postCount === 0).length },
        ]}
      />
      {isError ? (
        <ErrorState message="Etiketler yüklenemedi." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder="Etiket ara"
          searchText={(t) => `${t.name} ${t.slug}`}
          facets={facets}
          rowActions={rowActions}
          initialPageSize={20}
          toolbar={
            <button type="button" onClick={() => setEditing("new")} className={actionVariants({ variant: "dark", size: "sm" })}>
              <Plus aria-hidden /> Yeni etiket
            </button>
          }
          emptyState={<p className="text-muted-foreground">Henüz etiket yok.</p>}
        />
      )}
      <TagDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} item={editing === "new" ? null : editing} />
      {deleteDialog}
    </>
  );
}
