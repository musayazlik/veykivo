"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Pencil, Trash2, UserRound } from "lucide-react";
import { adminApi, unwrap } from "@/lib/api/browser";
import type { AdminTeamMember } from "@/lib/api/types";
import { EmptyState, ErrorState, PageHeader, PublishBadge } from "@/components/admin/ui";
import { DataTable, columnHelperFor, type Facet } from "@/components/admin/data-table";
import { useContentMutation } from "@/components/admin/use-save";
import { useDeleteConfirm } from "@/components/admin/use-delete-confirm";

const listKey = ["admin", "team"];
const col = columnHelperFor<AdminTeamMember>();
const columns = col.columns([
  col.accessor("name", {
    header: "Kişi",
    cell: ({ row }) => (
      <Link href={`/admin/ekip/${row.original.id}`} className="group flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mist text-muted-foreground">
          {row.original.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.original.photo.url} alt="" className="size-full object-cover" />
          ) : (
            <UserRound aria-hidden className="size-4" />
          )}
        </span>
        <span className="font-medium text-ink group-hover:underline">{row.original.name}</span>
      </Link>
    ),
  }),
  col.accessor("roleTitle", { header: "Unvan" }),
  col.accessor((m) => String(m.isPublished), {
    id: "status",
    header: "Durum",
    filterFn: "inArray",
    cell: ({ row }) => <PublishBadge published={row.original.isPublished} draftLabel="Gizli" />,
  }),
  col.accessor("sortOrder", { header: "Sıra", cell: (c) => <span className="tabular-nums">{c.getValue()}</span> }),
]);

const facets: Facet[] = [
  { columnId: "status", title: "Durum", options: [{ value: "true", label: "Sitede" }, { value: "false", label: "Gizli" }] },
];

export default function TeamAdminPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: listKey,
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/team")),
  });

  const remove = useContentMutation({
    mutationFn: (m: AdminTeamMember) => unwrap(adminApi.DELETE("/api/v1/admin/team/{id}", { params: { path: { id: m.id } } })),
    queryKey: listKey,
    tags: ["team"],
    successMessage: "Kişi silindi.",
  });
  const { request: askDelete, dialog: deleteDialog } = useDeleteConfirm<AdminTeamMember>({
    name: (m) => m.name,
    onDelete: (m) => remove.mutateAsync(m),
  });

  const rowActions = useMemo(
    () => (m: AdminTeamMember) => [
      { label: "Düzenle", icon: Pencil, href: `/admin/ekip/${m.id}` },
      ...(m.linkedInUrl ? [{ label: "LinkedIn profili", icon: ExternalLink, externalHref: m.linkedInUrl }] : []),
      { label: "Sil", icon: Trash2, destructive: true, separatorBefore: true, onSelect: () => askDelete(m) },
    ],
    [askDelete],
  );

  return (
    <>
      <PageHeader title="Ekip" description="Ekibimiz sayfasında görünen kişiler." newHref="/admin/ekip/yeni" newLabel="Yeni kişi" />
      {isError ? (
        <ErrorState message="Ekip yüklenemedi." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder="Ad veya unvan ara"
          searchText={(m) => `${m.name} ${m.roleTitle}`}
          facets={facets}
          rowActions={rowActions}
          initialSorting={[{ id: "sortOrder", desc: false }]}
          emptyState={<EmptyState title="Henüz ekip üyesi yok" text="Ekibinizi tanıtmak için ilk kişiyi ekleyin." href="/admin/ekip/yeni" cta="Yeni kişi" />}
        />
      )}
      {deleteDialog}
    </>
  );
}
