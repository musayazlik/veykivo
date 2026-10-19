"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { adminApi, unwrap } from "@/lib/api/browser";
import type { AdminCategory } from "@/lib/api/types";
import { ErrorState, PageHeader, StatGrid, formatDateTime } from "@/components/admin/ui";
import { DataTable, columnHelperFor } from "@/components/admin/data-table";
import { useContentMutation } from "@/components/admin/use-save";
import { useDeleteConfirm } from "@/components/admin/use-delete-confirm";
import { CategoryDialog, categoriesKey } from "@/components/admin/blog/taxonomy-dialogs";
import { actionVariants } from "@/components/site/action-link";

const col = columnHelperFor<AdminCategory>();
const columns = col.columns([
  col.accessor("name", {
    header: "Kategori",
    cell: ({ row }) => (
      <span className="flex items-center gap-3">
        <span aria-hidden className="size-3 shrink-0 rounded-full ring-4" style={{ background: row.original.color, ["--tw-ring-color" as string]: `${row.original.color}22` }} />
        <span className="min-w-0">
          <span className="block font-medium text-ink">{row.original.name}</span>
          <span className="block text-xs text-muted-foreground">/blog/kategori/{row.original.slug}</span>
        </span>
      </span>
    ),
  }),
  col.accessor("description", {
    header: "Açıklama",
    enableSorting: false,
    cell: (c) => <span className="line-clamp-2 max-w-sm text-sm text-muted-foreground">{c.getValue() ?? "—"}</span>,
  }),
  col.accessor("postCount", { header: "Yazı", cell: (c) => <span className="tabular-nums">{c.getValue()}</span> }),
  col.accessor("createdAt", {
    header: "Oluşturuldu",
    cell: (c) => <span className="text-sm whitespace-nowrap text-muted-foreground">{formatDateTime(c.getValue())}</span>,
  }),
]);

export default function CategoriesPage() {
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: categoriesKey,
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/categories")),
  });

  const remove = useContentMutation({
    mutationFn: (c: AdminCategory) => unwrap(adminApi.DELETE("/api/v1/admin/categories/{id}", { params: { path: { id: c.id } } })),
    queryKey: categoriesKey,
    tags: ["posts"],
    successMessage: "Kategori silindi.",
  });
  const { request: askDelete, dialog: deleteDialog } = useDeleteConfirm<AdminCategory>({
    name: (c) => c.name,
    onDelete: (c) => remove.mutateAsync(c),
    description: "Bu kategorideki yazılar silinmez, kategorisiz kalır. Yayındaki yazılara yeniden kategori atamanız gerekir.",
  });

  const rowActions = useMemo(
    () => (c: AdminCategory) => [
      { label: "Düzenle", icon: Pencil, onSelect: () => setEditing(c) },
      ...(c.postCount > 0 ? [{ label: "Sitede gör", icon: ExternalLink, externalHref: `/blog/kategori/${c.slug}` }] : []),
      { label: "Sil", icon: Trash2, destructive: true, separatorBefore: true, onSelect: () => askDelete(c) },
    ],
    [askDelete],
  );

  const items = data ?? [];
  const mostUsed = [...items].sort((a, b) => b.postCount - a.postCount)[0];

  return (
    <>
      <PageHeader title="Kategoriler" description="Blog yazılarını konu başlıklarına göre gruplayın." />
      <StatGrid
        items={[
          { label: "Toplam kategori", value: items.length },
          { label: "Kategorili yazı", value: items.reduce((s, c) => s + c.postCount, 0) },
          { label: "En çok kullanılan", value: mostUsed?.postCount ?? 0, hint: mostUsed?.name },
          { label: "Boş kategori", value: items.filter((c) => c.postCount === 0).length },
        ]}
      />
      {isError ? (
        <ErrorState message="Kategoriler yüklenemedi." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder="Kategori ara"
          searchText={(c) => `${c.name} ${c.slug} ${c.description ?? ""}`}
          rowActions={rowActions}
          toolbar={
            <button type="button" onClick={() => setEditing("new")} className={actionVariants({ variant: "dark", size: "sm" })}>
              <Plus aria-hidden /> Yeni kategori
            </button>
          }
          emptyState={<p className="text-muted-foreground">Henüz kategori yok. İlk kategoriyi oluşturun.</p>}
        />
      )}
      <CategoryDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} item={editing === "new" ? null : editing} />
      {deleteDialog}
    </>
  );
}
