"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpenText, Boxes, Cpu, FolderKanban, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminApi, unwrap } from "@/lib/api/browser";
import { ErrorState, LoadingState, PageHeader, formatDateTime } from "@/components/admin/ui";
import { InquiryStatusBadge } from "@/components/admin/inquiry-status";

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/dashboard")),
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message="Özet bilgiler yüklenemedi." onRetry={() => refetch()} />;

  const content = [
    { label: "Hizmet", value: data.services, href: "/admin/hizmetler", icon: Boxes },
    { label: "Proje", value: data.projects, href: "/admin/projeler", icon: FolderKanban },
    { label: "Blog yazısı", value: data.posts, href: "/admin/blog", icon: BookOpenText },
    { label: "Ekip üyesi", value: data.teamMembers, href: "/admin/ekip", icon: Users },
    { label: "Teknoloji", value: data.technologies, href: "/admin/teknolojiler", icon: Cpu },
  ];

  return (
    <>
      <PageHeader title="Genel bakış" description="Site içeriği ve gelen taleplerin özeti." />

      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        <Link
          href="/admin/talepler?durum=New"
          className="notch notch-sm flex flex-wrap items-center justify-between gap-4 bg-ink p-6 text-on-ink transition-colors hover:bg-ink-2"
        >
          <div>
            <p className="text-on-ink-muted">Yanıt bekleyen talep</p>
            <p className="mt-1 text-[2.5rem] leading-none font-bold tabular-nums">{data.newInquiries}</p>
          </div>
          <p className="text-sm text-on-ink-muted">Toplam {data.totalInquiries} talep</p>
        </Link>
        <Link
          href="/admin/blog/yorumlar"
          className={cn(
            "flex items-center justify-between gap-4 rounded-lg border p-6 transition-colors",
            data.pendingComments > 0 ? "border-signal/60 bg-signal/10 hover:bg-signal/15" : "border-line bg-white hover:border-teal",
          )}
        >
          <div>
            <p className="text-muted-foreground">Onay bekleyen yorum</p>
            <p className="mt-1 text-[2.5rem] leading-none font-bold tabular-nums text-ink">{data.pendingComments}</p>
          </div>
          <MessageSquare aria-hidden className="size-6 text-muted-foreground" />
        </Link>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {content.map(({ label, value, href, icon: Icon }) => (
          <li key={label}>
            <Link href={href} className="block rounded-lg border border-line bg-white p-4 transition-colors hover:border-teal">
              <Icon aria-hidden className="size-5 text-teal" />
              <p className="mt-3 text-2xl font-bold tabular-nums text-ink">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Son talepler</h2>
          <Link href="/admin/talepler" className="text-sm font-medium text-teal hover:underline">
            Tümünü gör
          </Link>
        </div>
        {data.recentInquiries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-input bg-white p-8 text-center text-muted-foreground">
            Henüz talep yok. Sitedeki teklif formundan gelen talepler burada görünecek.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-white">
            {data.recentInquiries.map((i) => (
              <li key={i.id}>
                <Link href={`/admin/talepler/${i.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-paper/70">
                  <span className="font-medium text-ink">{i.name}</span>
                  <span className="text-sm text-muted-foreground">{i.company ?? i.email}</span>
                  <span className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
                    {formatDateTime(i.createdAt)}
                    <InquiryStatusBadge status={i.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
