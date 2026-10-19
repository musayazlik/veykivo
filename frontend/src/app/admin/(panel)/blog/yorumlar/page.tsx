"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Ban, CheckCircle2, Clock3, CornerDownRight, ExternalLink, LoaderCircle, Reply, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi, errorMessage, unwrap } from "@/lib/api/browser";
import type { AdminComment, CommentStatus } from "@/lib/api/types";
import { ErrorState, LoadingState, PageHeader, formatDateTime } from "@/components/admin/ui";
import { DataTable, columnHelperFor, type Facet, type TableQuery } from "@/components/admin/data-table";
import { useDeleteConfirm } from "@/components/admin/use-delete-confirm";
import { Field, inputClass } from "@/components/admin/form";
import { revalidateContent } from "@/app/admin/actions";
import { actionVariants } from "@/components/site/action-link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const statusLabels: Record<CommentStatus, string> = { Pending: "Onay bekliyor", Approved: "Onaylı", Spam: "Spam" };
const statusStyles: Record<CommentStatus, string> = {
  Pending: "bg-signal/25 text-ink",
  Approved: "bg-teal/10 text-teal",
  Spam: "bg-destructive/10 text-destructive",
};

function CommentStatusBadge({ status }: { status: CommentStatus }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", statusStyles[status])}>{statusLabels[status]}</span>;
}

const col = columnHelperFor<AdminComment>();
const columns = col.columns([
  col.accessor("authorName", {
    header: "Yorum",
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div className="max-w-xl min-w-64">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {c.parentId && <CornerDownRight aria-label="Yanıt" className="size-3.5 text-muted-foreground" />}
            <span className="font-medium text-ink">{c.authorName}</span>
            {c.isStaffReply && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[0.7rem] font-medium text-on-ink">
                <ShieldCheck aria-hidden className="size-3" /> Ekip
              </span>
            )}
            {c.authorEmail && <span className="text-xs text-muted-foreground">{c.authorEmail}</span>}
          </p>
          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-ink/80">{c.body}</p>
          {c.replyCount > 0 && <p className="mt-1 text-xs text-muted-foreground">{c.replyCount} yanıt</p>}
        </div>
      );
    },
  }),
  col.accessor("postTitle", {
    header: "Yazı",
    cell: ({ row }) => (
      <a href={`/blog/${row.original.postSlug}`} target="_blank" className="line-clamp-2 max-w-56 text-sm text-ink/85 hover:text-ink hover:underline">
        {row.original.postTitle}
      </a>
    ),
  }),
  col.accessor("status", { header: "Durum", cell: (c) => <CommentStatusBadge status={c.getValue()} /> }),
  col.accessor("createdAt", {
    header: "Tarih",
    cell: (c) => <span className="text-sm whitespace-nowrap text-muted-foreground">{formatDateTime(c.getValue())}</span>,
  }),
]);

const statuses: CommentStatus[] = ["Pending", "Approved", "Spam"];
const facets: Facet[] = [{ columnId: "status", title: "Durum", options: statuses.map((s) => ({ value: s, label: statusLabels[s] })) }];

export default function CommentsPage() {
  return (
    <>
      <PageHeader title="Yorumlar" description="Ziyaretçi yorumları onaylanmadan sitede görünmez. Yanıtlarınız ekip rozetiyle yayınlanır." />
      <Suspense fallback={<LoadingState />}>
        <CommentList />
      </Suspense>
    </>
  );
}

function CommentList() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [replyTo, setReplyTo] = useState<AdminComment | null>(null);

  // Varsayılan görünüm onay bekleyenler; "Tümü" için durum=hepsi.
  const rawStatus = params.get("durum");
  const status = rawStatus === "hepsi" ? undefined : ((rawStatus as CommentStatus | null) ?? "Pending");
  const query: TableQuery = {
    search: params.get("ara") ?? "",
    filters: status ? { status: [status] } : {},
    pageIndex: Math.max(0, Number(params.get("sayfa") ?? 1) - 1),
    pageSize: Number(params.get("adet") ?? 20) || 20,
  };

  const listKey = ["admin", "comments"];
  const { data, isLoading, isError, refetch, isPlaceholderData } = useQuery({
    queryKey: [...listKey, status, query.search, query.pageIndex, query.pageSize],
    queryFn: () =>
      unwrap(
        adminApi.GET("/api/v1/admin/comments", {
          params: { query: { status, q: query.search || undefined, page: query.pageIndex + 1, pageSize: query.pageSize } },
        }),
      ),
    placeholderData: keepPreviousData,
  });

  const afterChange = async (message: string) => {
    toast.success(message);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: listKey }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] }),
      revalidateContent(["posts"]).catch(() => undefined),
    ]);
  };

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CommentStatus }) =>
      unwrap(adminApi.PATCH("/api/v1/admin/comments/{id}", { params: { path: { id } }, body: { status } })),
    onSuccess: (_, v) => afterChange(v.status === "Approved" ? "Yorum onaylandı." : v.status === "Spam" ? "Yorum spam olarak işaretlendi." : "Yorum beklemeye alındı."),
    onError: (err) => toast.error(errorMessage(err)),
  });
  const remove = useMutation({
    mutationFn: (c: AdminComment) => unwrap(adminApi.DELETE("/api/v1/admin/comments/{id}", { params: { path: { id: c.id } } })),
    onSuccess: () => afterChange("Yorum silindi."),
    onError: (err) => toast.error(errorMessage(err)),
  });
  const { request: askDelete, dialog: deleteDialog } = useDeleteConfirm<AdminComment>({
    name: (c) => `${c.authorName} yorumu`,
    onDelete: (c) => remove.mutateAsync(c),
    description: "Yorum ve varsa yanıtları kalıcı olarak silinir.",
  });
  const mutateStatus = setStatus.mutate;

  const rowActions = useMemo(
    () => (c: AdminComment) => [
      { label: "Onayla", icon: CheckCircle2, disabled: c.status === "Approved", onSelect: () => mutateStatus({ id: c.id, status: "Approved" }) },
      { label: "Yanıtla", icon: Reply, onSelect: () => setReplyTo(c) },
      { label: "Beklemeye al", icon: Clock3, separatorBefore: true, disabled: c.status === "Pending", onSelect: () => mutateStatus({ id: c.id, status: "Pending" }) },
      { label: "Spam olarak işaretle", icon: Ban, disabled: c.status === "Spam", onSelect: () => mutateStatus({ id: c.id, status: "Spam" }) },
      { label: "Yazıyı sitede aç", icon: ExternalLink, externalHref: `/blog/${c.postSlug}#yorumlar` },
      { label: "Sil", icon: Trash2, destructive: true, separatorBefore: true, onSelect: () => askDelete(c) },
    ],
    [askDelete, mutateStatus],
  );

  const onQueryChange = (next: TableQuery) => {
    const q = new URLSearchParams();
    if (next.search) q.set("ara", next.search);
    const s = next.filters.status?.[0];
    q.set("durum", s ?? "hepsi");
    if (next.pageIndex > 0) q.set("sayfa", String(next.pageIndex + 1));
    if (next.pageSize !== 20) q.set("adet", String(next.pageSize));
    router.replace(`${pathname}?${q}`);
  };

  if (isError) return <ErrorState message="Yorumlar yüklenemedi." onRetry={() => refetch()} />;

  return (
    <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        searchPlaceholder="Ad, e-posta, yorum veya yazı ara"
        facets={facets}
        rowActions={rowActions}
        server={{ rowCount: data?.totalCount ?? 0, query, onQueryChange, singleValueFacets: true }}
        getRowClassName={(c) => (c.status === "Pending" ? "bg-signal/5" : undefined)}
        emptyState={
          <p className="text-muted-foreground">
            {status === "Pending" ? "Onay bekleyen yorum yok. Her şey güncel." : "Bu görünümde yorum yok."}
          </p>
        }
      />
      <ReplyDialog comment={replyTo} onClose={() => setReplyTo(null)} onReplied={() => afterChange("Yanıtınız yayınlandı.")} />
      {deleteDialog}
    </div>
  );
}

function ReplyDialog({ comment, onClose, onReplied }: { comment: AdminComment | null; onClose: () => void; onReplied: () => Promise<void> }) {
  const { register, handleSubmit, reset, formState } = useForm<{ body: string }>({ defaultValues: { body: "" } });
  const reply = useMutation({
    mutationFn: (body: string) =>
      unwrap(adminApi.POST("/api/v1/admin/comments/{id}/reply", { params: { path: { id: comment!.id } }, body: { body } })),
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={comment !== null} onOpenChange={(o) => !o && (reset(), onClose())}>
      <DialogContent className="sm:max-w-lg">
        {comment && (
          <form
            noValidate
            className="space-y-5"
            onSubmit={handleSubmit(async ({ body }) => {
              await reply.mutateAsync(body);
              reset();
              onClose();
              await onReplied();
            })}
          >
            <DialogHeader>
              <DialogTitle>Yoruma yanıt ver</DialogTitle>
              <DialogDescription>
                Yanıtınız onaylı olarak, ekip rozetiyle yayınlanır. {comment.status !== "Approved" && !comment.parentId && "Yanıtlanan yorum da onaylanır."}
              </DialogDescription>
            </DialogHeader>
            <blockquote className="rounded-md border-l-3 border-signal bg-paper px-4 py-3 text-sm">
              <p className="font-medium text-ink">{comment.authorName}</p>
              <p className="mt-1 whitespace-pre-line text-ink/80">{comment.body}</p>
            </blockquote>
            <Field label="Yanıtınız" htmlFor="reply-body" error={formState.errors.body?.message}>
              <textarea
                id="reply-body"
                rows={5}
                autoFocus
                className={inputClass}
                aria-invalid={!!formState.errors.body}
                {...register("body", { required: "Yanıt boş olamaz.", maxLength: { value: 2000, message: "En fazla 2000 karakter." } })}
              />
            </Field>
            <DialogFooter>
              <button type="button" onClick={onClose} className={actionVariants({ variant: "outline", size: "sm" })}>
                Vazgeç
              </button>
              <button type="submit" disabled={formState.isSubmitting} className={actionVariants({ variant: "dark", size: "sm" })}>
                {formState.isSubmitting && <LoaderCircle aria-hidden className="animate-spin" />}
                Yanıtı yayınla
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
