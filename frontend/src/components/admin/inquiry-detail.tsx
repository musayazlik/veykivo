"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { adminApi, errorMessage, unwrap } from "@/lib/api/browser";
import type { InquiryStatus } from "@/lib/api/types";
import { ErrorState, LoadingState, PageHeader, formatDateTime } from "./ui";
import { InquiryStatusBadge, inquiryStatusLabels } from "./inquiry-status";
import { cn } from "@/lib/utils";

const statuses: InquiryStatus[] = ["New", "InProgress", "Completed"];

export function InquiryDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "inquiries", "detail", id],
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/inquiries/{id}", { params: { path: { id } } })),
  });

  const update = useMutation({
    mutationFn: (status: InquiryStatus) =>
      unwrap(adminApi.PATCH("/api/v1/admin/inquiries/{id}", { params: { path: { id } }, body: { status } })),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "inquiries", "detail", id], data);
      queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Durum "${inquiryStatusLabels[data.status]}" olarak güncellendi.`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState message="Talep bulunamadı." />;
  const i = query.data;

  return (
    <>
      <PageHeader title={i.name} description={`${formatDateTime(i.createdAt)} tarihinde gönderildi`} backHref="/admin/talepler">
        <InquiryStatusBadge status={i.status} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-lg border border-line bg-white p-6">
          <h2 className="font-semibold text-ink">Mesaj</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-ink/90">{i.message}</p>
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="font-semibold text-ink">İletişim</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">E-posta</dt>
                <dd>
                  <a href={`mailto:${i.email}`} className="inline-flex items-center gap-1.5 font-medium text-teal hover:underline">
                    <Mail aria-hidden className="size-3.5" /> {i.email}
                  </a>
                </dd>
              </div>
              {i.phone && (
                <div>
                  <dt className="text-muted-foreground">Telefon</dt>
                  <dd>
                    <a href={`tel:${i.phone}`} className="inline-flex items-center gap-1.5 font-medium text-teal hover:underline">
                      <Phone aria-hidden className="size-3.5" /> {i.phone}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Şirket</dt>
                <dd className="font-medium text-ink">{i.company ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">İlgilendiği hizmet</dt>
                <dd className="font-medium text-ink">{i.serviceInterest ?? "Belirtilmedi"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">KVKK onayı</dt>
                <dd className="text-ink">{formatDateTime(i.consentedAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="font-semibold text-ink">Durumu güncelle</h2>
            <div role="radiogroup" aria-label="Talep durumu" className="mt-4 grid gap-2">
              {statuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={i.status === s}
                  disabled={update.isPending}
                  onClick={() => i.status !== s && update.mutate(s)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors disabled:opacity-60",
                    i.status === s ? "border-ink bg-ink text-on-ink" : "border-line bg-white text-ink hover:border-input",
                  )}
                >
                  {inquiryStatusLabels[s]}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Son güncelleme: {formatDateTime(i.updatedAt)}</p>
          </section>
        </div>
      </div>
    </>
  );
}
