"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { adminApi, unwrap } from "@/lib/api/browser";
import type { AdminService } from "@/lib/api/types";
import { EmptyState, ErrorState, PageHeader, PublishBadge, formatDateTime } from "@/components/admin/ui";
import { DataTable, columnHelperFor, type Facet } from "@/components/admin/data-table";
import { useContentMutation } from "@/components/admin/use-save";
import { useDeleteConfirm } from "@/components/admin/use-delete-confirm";
import { ServiceIcon } from "@/components/site/service-icon";

const listKey = ["admin", "services"];
const col = columnHelperFor<AdminService>();
const columns = col.columns([
  col.accessor("title", {
    header: "Hizmet",
    cell: ({ row }) => (
      <Link href={`/admin/hizmetler/${row.original.id}`} className="group flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-mist text-teal">
          <ServiceIcon name={row.original.icon} className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block font-medium text-ink group-hover:underline">{row.original.title}</span>
          <span className="block truncate text-xs text-muted-foreground">/hizmetler/{row.original.slug}</span>
        </span>
      </Link>
    ),
  }),
  col.accessor((s) => String(s.isPublished), {
    id: "status",
    header: "Durum",
    filterFn: "inArray",
    cell: ({ row }) => <PublishBadge published={row.original.isPublished} />,
  }),
  col.accessor("sortOrder", { header: "Sıra", cell: (c) => <span className="tabular-nums">{c.getValue()}</span> }),
  col.accessor("updatedAt", {
    header: "Güncellendi",
    cell: (c) => <span className="text-sm whitespace-nowrap text-muted-foreground">{formatDateTime(c.getValue())}</span>,
  }),
]);

const facets: Facet[] = [
  { columnId: "status", title: "Durum", options: [{ value: "true", label: "Yayında" }, { value: "false", label: "Taslak" }] },
];

export default function ServicesAdminPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: listKey,
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/services")),
  });

  const remove = useContentMutation({
    mutationFn: (s: AdminService) => unwrap(adminApi.DELETE("/api/v1/admin/services/{id}", { params: { path: { id: s.id } } })),
    queryKey: listKey,
    tags: ["services"],
    successMessage: "Hizmet silindi.",
  });
  const { request: askDelete, dialog: deleteDialog } = useDeleteConfirm<AdminService>({ name: (s) => s.title, onDelete: (s) => remove.mutateAsync(s) });

  const rowActions = useMemo(
    () => (s: AdminService) => [
      { label: "Düzenle", icon: Pencil, href: `/admin/hizmetler/${s.id}` },
      ...(s.isPublished ? [{ label: "Sitede gör", icon: ExternalLink, externalHref: `/hizmetler/${s.slug}` }] : []),
      { label: "Sil", icon: Trash2, destructive: true, separatorBefore: true, onSelect: () => askDelete(s) },
    ],
    [askDelete],
  );

  return (
    <>
      <PageHeader title="Hizmetler" description="Sitede listelenen hizmetler ve detay sayfaları." newHref="/admin/hizmetler/yeni" newLabel="Yeni hizmet" />
      {isError ? (
        <ErrorState message="Hizmetler yüklenemedi." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder="Hizmet adı veya adres ara"
          searchText={(s) => `${s.title} ${s.slug} ${s.summary}`}
          facets={facets}
          rowActions={rowActions}
          initialSorting={[{ id: "sortOrder", desc: false }]}
          emptyState={<EmptyState title="Henüz hizmet yok" text="İlk hizmetinizi ekleyin; yayına aldığınızda sitede görünür." href="/admin/hizmetler/yeni" cta="Yeni hizmet" />}
        />
      )}
      {deleteDialog}
    </>
  );
}
