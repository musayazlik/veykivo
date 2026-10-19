"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminApi, errorMessage, unwrap } from "@/lib/api/browser";
import type { MediaAsset } from "@/lib/api/types";
import { DeleteButton, ErrorState, LoadingState, PageHeader } from "@/components/admin/ui";
import { MediaUploader, mediaQueryKey, useMediaLibrary } from "@/components/admin/media-picker";
import { actionVariants } from "@/components/site/action-link";
import { inputClass } from "@/components/admin/form";

const PAGE_SIZE = 12;

export default function MediaPage() {
  const library = useMediaLibrary();
  const [search, setSearch] = useState("");
  const [missingAlt, setMissingAlt] = useState(false);
  const [page, setPage] = useState(0);

  const all = library.data ?? [];
  const term = search.trim().toLocaleLowerCase("tr");
  const filtered = all.filter((m) => (!term || m.altText.toLocaleLowerCase("tr").includes(term) || m.url.includes(term)) && (!missingAlt || !m.altText));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const missingCount = all.filter((m) => !m.altText).length;

  return (
    <>
      <PageHeader title="Medya" description="Hizmet, proje, blog ve ekip görselleri. Her görsele açıklayıcı bir alternatif metin yazın." />
      <MediaUploader />
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => (setSearch(e.target.value), setPage(0))}
            placeholder="Alternatif metinde ara"
            aria-label="Alternatif metinde ara"
            className="h-9 w-full rounded-md border border-input bg-white pr-3 pl-9 text-sm outline-none focus:border-teal focus:ring-3 focus:ring-teal/20"
          />
        </div>
        <button
          type="button"
          aria-pressed={missingAlt}
          onClick={() => (setMissingAlt((v) => !v), setPage(0))}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-md border border-dashed px-3 text-sm font-medium",
            missingAlt ? "border-ink/40 bg-white text-ink" : "border-input bg-white text-ink/80 hover:border-ink/40",
          )}
        >
          Alt metni eksik
          <span className={cn("rounded px-1.5 text-xs tabular-nums", missingCount ? "bg-signal/30 text-ink" : "bg-mist")}>{missingCount}</span>
        </button>
        <p className="ml-auto text-sm text-muted-foreground tabular-nums">{filtered.length} görsel</p>
      </div>
      <div className="mt-4">
        {library.isLoading ? (
          <LoadingState />
        ) : library.isError || !library.data ? (
          <ErrorState message="Görseller yüklenemedi." onRetry={() => library.refetch()} />
        ) : visible.length === 0 ? (
          <p className="rounded-lg border border-dashed border-input bg-white p-10 text-center text-muted-foreground">
            {all.length === 0 ? "Henüz görsel yok." : "Filtrelere uyan görsel yok."}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((m) => (
              <MediaCard key={m.id} asset={m} />
            ))}
          </ul>
        )}
        {pageCount > 1 && (
          <nav aria-label="Sayfalama" className="mt-6 flex items-center justify-center gap-1">
            <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)} className="flex size-9 items-center justify-center rounded-md hover:bg-mist disabled:opacity-35" aria-label="Önceki sayfa">
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-current={i === current ? "page" : undefined}
                onClick={() => setPage(i)}
                className={cn("min-w-9 rounded-md px-2 py-1.5 text-sm font-medium tabular-nums", i === current ? "bg-ink text-on-ink" : "hover:bg-mist")}
              >
                {i + 1}
              </button>
            ))}
            <button type="button" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)} className="flex size-9 items-center justify-center rounded-md hover:bg-mist disabled:opacity-35" aria-label="Sonraki sayfa">
              <ChevronRight className="size-4" />
            </button>
          </nav>
        )}
      </div>
    </>
  );
}

function MediaCard({ asset }: { asset: MediaAsset }) {
  const queryClient = useQueryClient();
  const [alt, setAlt] = useState(asset.altText);

  const saveAlt = useMutation({
    mutationFn: () => unwrap(adminApi.PATCH("/api/v1/admin/media/{id}", { params: { path: { id: asset.id } }, body: { altText: alt } })),
    onSuccess: () => {
      toast.success("Alternatif metin kaydedildi.");
      queryClient.invalidateQueries({ queryKey: mediaQueryKey });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: () => unwrap(adminApi.DELETE("/api/v1/admin/media/{id}", { params: { path: { id: asset.id } } })),
    onSuccess: () => {
      toast.success("Görsel silindi.");
      queryClient.invalidateQueries({ queryKey: mediaQueryKey });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <li className="overflow-hidden rounded-lg border border-line bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.url} alt={asset.altText} loading="lazy" className="aspect-[16/10] w-full bg-mist object-cover" />
      <div className="space-y-3 p-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">Alternatif metin</span>
          <input value={alt} onChange={(e) => setAlt(e.target.value)} className={inputClass} placeholder="Görselde ne görünüyor?" />
        </label>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {asset.mimeType.replace("image/", "").toUpperCase()}
            {asset.sizeBytes > 0 && ` / ${(asset.sizeBytes / 1024).toFixed(0)} KB`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={alt === asset.altText || saveAlt.isPending}
              onClick={() => saveAlt.mutate()}
              className={actionVariants({ variant: "dark", size: "sm" })}
            >
              Kaydet
            </button>
            <DeleteButton itemName={asset.altText || "Görsel"} onConfirm={() => remove.mutateAsync()} />
          </div>
        </div>
      </div>
    </li>
  );
}
