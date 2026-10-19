"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, LoaderCircle, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi, errorMessage, unwrap, uploadMedia } from "@/lib/api/browser";
import type { Media, MediaAsset } from "@/lib/api/types";
import { actionVariants } from "@/components/site/action-link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const mediaQueryKey = ["media"];

export function useMediaLibrary(enabled = true) {
  return useQuery({
    queryKey: mediaQueryKey,
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/media")),
    enabled,
  });
}

/** Tek görsel seçimi: kütüphaneden seç veya yeni yükle. Değer olarak medya kimliği tutulur. */
export function MediaPicker({
  value,
  initial,
  onChange,
  label = "Kapak görseli",
}: {
  value: string | null | undefined;
  initial?: Media | null;
  onChange: (id: string | null) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const library = useMediaLibrary(open || Boolean(value && value !== initial?.id));
  const selected: Pick<MediaAsset, "id" | "url" | "altText"> | null | undefined =
    value == null ? null : value === initial?.id ? initial : library.data?.find((m) => m.id === value);

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      <div className="space-y-3">
        <div className="relative aspect-[16/10] w-full max-w-sm overflow-hidden rounded-md border border-line bg-mist">
          {selected ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.url} alt={selected.altText} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImagePlus aria-hidden className="size-6" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setOpen(true)} className={actionVariants({ variant: "outline", size: "sm" })}>
            {selected ? "Görseli değiştir" : "Görsel seç"}
          </button>
          {selected && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
            >
              <X aria-hidden className="size-3.5" /> Kaldır
            </button>
          )}
          {selected && !selected.altText && (
            <p className="w-full text-xs text-destructive">Bu görselin alternatif metni yok. Medya sayfasından ekleyin.</p>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Görsel seçin</DialogTitle>
            <DialogDescription>Kütüphaneden bir görsel seçin veya yeni bir görsel yükleyin.</DialogDescription>
          </DialogHeader>
          <MediaUploader
            onUploaded={(asset) => {
              onChange(asset.id);
              setOpen(false);
            }}
          />
          <div className="max-h-[50vh] overflow-y-auto">
            {library.isLoading ? (
              <div className="flex justify-center py-10">
                <LoaderCircle className="size-5 animate-spin text-teal" />
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {library.data?.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(m.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "group block w-full overflow-hidden rounded-md border-2 text-left",
                        m.id === value ? "border-teal" : "border-transparent hover:border-input",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt={m.altText} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                      <span className="block truncate px-1.5 py-1 text-xs text-muted-foreground">{m.altText || "Alt metin yok"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function MediaUploader({ onUploaded }: { onUploaded?: (asset: MediaAsset) => void }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const asset = await uploadMedia(file, alt);
      await queryClient.invalidateQueries({ queryKey: mediaQueryKey });
      toast.success("Görsel yüklendi.");
      setFile(null);
      setAlt("");
      if (fileRef.current) fileRef.current.value = "";
      onUploaded?.(asset);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border border-dashed border-input bg-paper/60 p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink">Dosya (JPG, PNG, WEBP, AVIF, en fazla 5 MB)</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-on-ink"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink">Alternatif metin</span>
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Görselde ne görünüyor?"
            className="block w-full rounded-md border border-input bg-white px-3 py-1.5"
          />
        </label>
        <button type="button" disabled={!file || busy} onClick={submit} className={actionVariants({ variant: "dark", size: "sm" })}>
          {busy ? <LoaderCircle aria-hidden className="animate-spin" /> : <Upload aria-hidden />}
          Yükle
        </button>
      </div>
    </div>
  );
}
