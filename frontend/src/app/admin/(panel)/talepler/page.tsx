"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Clock3, Eye, Mail } from "lucide-react";
import { toast } from "sonner";
import { adminApi, errorMessage, unwrap } from "@/lib/api/browser";
import type { InquiryListItem, InquiryStatus } from "@/lib/api/types";
import { ErrorState, LoadingState, PageHeader, formatDateTime } from "@/components/admin/ui";
import { DataTable, columnHelperFor, type Facet, type TableQuery } from "@/components/admin/data-table";
import { InquiryStatusBadge, inquiryStatusLabels } from "@/components/admin/inquiry-status";
import { cn } from "@/lib/utils";

const col = columnHelperFor<InquiryListItem>();
const columns = col.columns([
  col.accessor("name", {
    header: "Kişi",
    cell: ({ row }) => (
      <Link href={`/admin/talepler/${row.original.id}`} className="group block">
        <span className={cn("block text-ink group-hover:underline", row.original.status === "New" ? "font-semibold" : "font-medium")}>
          {row.original.name}
        </span>
        <span className="block text-xs text-muted-foreground">{row.original.email}</span>
      </Link>
    ),
  }),
  col.accessor("company", { header: "Şirket", cell: (c) => c.getValue() ?? "—" }),
  col.accessor("serviceInterest", { header: "İlgilendiği hizmet", cell: (c) => <span className="text-sm">{c.getValue() ?? "—"}</span> }),
  col.accessor("status", { header: "Durum", cell: (c) => <InquiryStatusBadge status={c.getValue()} /> }),
  col.accessor("createdAt", {
    header: "Tarih",
    cell: (c) => <span className="text-sm whitespace-nowrap text-muted-foreground">{formatDateTime(c.getValue())}</span>,
  }),
]);

const statuses: InquiryStatus[] = ["New", "InProgress", "Completed"];
const facets: Facet[] = [{ columnId: "status", title: "Durum", options: statuses.map((s) => ({ value: s, label: inquiryStatusLabels[s] })) }];

export default function InquiriesPage() {
  return (
    <>
      <PageHeader title="Talepler" description="Sitedeki teklif ve iletişim formundan gelen talepler." />
      <Suspense fallback={<LoadingState />}>
        <InquiryList />
      </Suspense>
    </>
  );
}

/** Sunucu tarafı sayfalanan liste; filtre ve sayfa URL'de tutulur (paylaşılabilir, geri tuşuyla korunur). */
function InquiryList() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const query: TableQuery = {
    search: params.get("ara") ?? "",
    filters: params.get("durum") ? { status: [params.get("durum")!] } : {},
    pageIndex: Math.max(0, Number(params.get("sayfa") ?? 1) - 1),
    pageSize: Number(params.get("adet") ?? 20) || 20,
  };
  const status = (query.filters.status?.[0] as InquiryStatus | undefined) ?? undefined;

  const { data, isLoading, isError, refetch, isPlaceholderData } = useQuery({
    queryKey: ["admin", "inquiries", status, query.search, query.pageIndex, query.pageSize],
    queryFn: () =>
      unwrap(
        adminApi.GET("/api/v1/admin/inquiries", {
          params: { query: { status, q: query.search || undefined, page: query.pageIndex + 1, pageSize: query.pageSize } },
        }),
      ),
    placeholderData: keepPreviousData,
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InquiryStatus }) =>
      unwrap(adminApi.PATCH("/api/v1/admin/inquiries/{id}", { params: { path: { id } }, body: { status } })),
    onSuccess: (d) => {
      toast.success(`Durum "${inquiryStatusLabels[d.status]}" olarak güncellendi.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const mutate = setStatus.mutate;

  const rowActions = useMemo(
    () => (i: InquiryListItem) => [
      { label: "Detayı aç", icon: Eye, href: `/admin/talepler/${i.id}` },
      { label: "E-posta gönder", icon: Mail, externalHref: `mailto:${i.email}` },
      { label: "İşleme al", icon: Clock3, separatorBefore: true, disabled: i.status === "InProgress", onSelect: () => mutate({ id: i.id, status: "InProgress" }) },
      { label: "Tamamlandı olarak işaretle", icon: CheckCheck, disabled: i.status === "Completed", onSelect: () => mutate({ id: i.id, status: "Completed" }) },
    ],
    [mutate],
  );

  const onQueryChange = (next: TableQuery) => {
    const q = new URLSearchParams();
    if (next.search) q.set("ara", next.search);
    if (next.filters.status?.[0]) q.set("durum", next.filters.status[0]);
    if (next.pageIndex > 0) q.set("sayfa", String(next.pageIndex + 1));
    if (next.pageSize !== 20) q.set("adet", String(next.pageSize));
    router.replace(`${pathname}${q.size ? `?${q}` : ""}`);
  };

  if (isError) return <ErrorState message="Talepler yüklenemedi." onRetry={() => refetch()} />;

  return (
    <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        searchPlaceholder="Ad, e-posta veya şirket ara"
        facets={facets}
        rowActions={rowActions}
        server={{ rowCount: data?.totalCount ?? 0, query, onQueryChange, singleValueFacets: true }}
        getRowClassName={(i) => (i.status === "New" ? "bg-signal/5" : undefined)}
        emptyState={<p className="text-muted-foreground">Henüz talep yok. Sitedeki teklif formundan gelen talepler burada görünecek.</p>}
      />
    </div>
  );
}
