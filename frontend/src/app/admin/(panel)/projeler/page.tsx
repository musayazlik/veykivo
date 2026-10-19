"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Pencil, Star, Trash2 } from "lucide-react";
import { adminApi, unwrap } from "@/lib/api/browser";
import type { AdminProject } from "@/lib/api/types";
import { EmptyState, ErrorState, PageHeader, PublishBadge, formatDateTime } from "@/components/admin/ui";
import { DataTable, columnHelperFor, type Facet } from "@/components/admin/data-table";
import { useContentMutation } from "@/components/admin/use-save";
import { useDeleteConfirm } from "@/components/admin/use-delete-confirm";

const listKey = ["admin", "projects"];
const col = columnHelperFor<AdminProject>();
const columns = col.columns([
  col.accessor("title", {
    header: "Proje",
    cell: ({ row }) => (
      <Link href={`/admin/projeler/${row.original.id}`} className="group flex items-center gap-3">
        <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-mist">
          {row.original.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.original.coverImage.url} alt="" className="size-full object-cover" />
          )}
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 font-medium text-ink group-hover:underline">
            {row.original.title}
            {row.original.isFeatured && <Star aria-label="Ana sayfada öne çıkan" className="size-3.5 shrink-0 fill-signal text-signal" />}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{row.original.clientName ?? "Müşteri belirtilmedi"}</span>
        </span>
      </Link>
    ),
  }),
  col.accessor((p) => p.sector ?? "—", { id: "sector", header: "Sektör", filterFn: "inArray" }),
  col.accessor((p) => String(p.isPublished), {
    id: "status",
    header: "Durum",
    filterFn: "inArray",
    cell: ({ row }) => <PublishBadge published={row.original.isPublished} />,
  }),
  col.accessor((p) => String(p.isFeatured), { id: "featured", header: "Öne çıkan", filterFn: "inArray", cell: (c) => (c.getValue() === "true" ? "Evet" : "—") }),
  col.accessor("updatedAt", {
    header: "Güncellendi",
    cell: (c) => <span className="text-sm whitespace-nowrap text-muted-foreground">{formatDateTime(c.getValue())}</span>,
  }),
]);

export default function ProjectsAdminPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: listKey,
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/projects")),
  });

  const remove = useContentMutation({
    mutationFn: (p: AdminProject) => unwrap(adminApi.DELETE("/api/v1/admin/projects/{id}", { params: { path: { id: p.id } } })),
    queryKey: listKey,
    tags: ["projects"],
    successMessage: "Proje silindi.",
  });
  const { request: askDelete, dialog: deleteDialog } = useDeleteConfirm<AdminProject>({ name: (p) => p.title, onDelete: (p) => remove.mutateAsync(p) });

  const facets = useMemo<Facet[]>(() => {
    const sectors = [...new Set((data ?? []).map((p) => p.sector ?? "—"))].sort((a, b) => a.localeCompare(b, "tr"));
    return [
      { columnId: "status", title: "Durum", options: [{ value: "true", label: "Yayında" }, { value: "false", label: "Taslak" }] },
      { columnId: "sector", title: "Sektör", options: sectors.map((s) => ({ value: s, label: s === "—" ? "Belirtilmemiş" : s })) },
      { columnId: "featured", title: "Öne çıkan", options: [{ value: "true", label: "Öne çıkan" }, { value: "false", label: "Diğer" }] },
    ];
  }, [data]);

  const rowActions = useMemo(
    () => (p: AdminProject) => [
      { label: "Düzenle", icon: Pencil, href: `/admin/projeler/${p.id}` },
      ...(p.isPublished ? [{ label: "Sitede gör", icon: ExternalLink, externalHref: `/projeler/${p.slug}` }] : []),
      { label: "Sil", icon: Trash2, destructive: true, separatorBefore: true, onSelect: () => askDelete(p) },
    ],
    [askDelete],
  );

  return (
    <>
      <PageHeader title="Projeler" description="Referans projeler ve vaka çalışmaları." newHref="/admin/projeler/yeni" newLabel="Yeni proje" />
      {isError ? (
        <ErrorState message="Projeler yüklenemedi." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder="Proje, müşteri veya sektör ara"
          searchText={(p) => `${p.title} ${p.clientName ?? ""} ${p.sector ?? ""} ${p.slug}`}
          facets={facets}
          rowActions={rowActions}
          emptyState={<EmptyState title="Henüz proje yok" text="Müşteri izni alınmış projelerinizi ekleyin." href="/admin/projeler/yeni" cta="Yeni proje" />}
        />
      )}
      {deleteDialog}
    </>
  );
}
