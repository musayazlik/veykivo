"use client";

import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import type { MediaAsset } from "@/lib/api/types";
import { MediaUploader, useMediaLibrary } from "../media-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { actionVariants } from "@/components/site/action-link";
import { cn } from "@/lib/utils";

/**
 * İçerik içi görsel ekleme: medya kütüphanesinden çoklu seçim veya anında
 * yükleme. Seçim, editöre görsel düğümü olarak eklenir.
 */
export function MediaInsertDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (assets: MediaAsset[]) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Görsel ekle</DialogTitle>
          <DialogDescription>Kütüphaneden seçin veya yeni bir görsel yükleyin; yüklenen görsel doğrudan içeriğe eklenir.</DialogDescription>
        </DialogHeader>

        <MediaUploader
          onUploaded={(asset) => {
            onSelect([asset]);
            onOpenChange(false);
          }}
        />

        {/* Yalnızca açıkken mount olduğu için seçim her açılışta sıfırdan başlar. */}
        <MediaInsertGrid onSelect={(assets) => (onSelect(assets), onOpenChange(false))} />
      </DialogContent>
    </Dialog>
  );
}

function MediaInsertGrid({ onSelect }: { onSelect: (assets: MediaAsset[]) => void }) {
  const library = useMediaLibrary();
  const [selected, setSelected] = useState<string[]>([]);
  const chosen = (library.data ?? []).filter((m) => selected.includes(m.id));

  return (
    <div>
      <div className="max-h-[50vh] overflow-y-auto">
        {library.isLoading ? (
          <div className="flex justify-center py-10">
            <LoaderCircle className="size-5 animate-spin text-teal" />
          </div>
        ) : (library.data ?? []).length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Kütüphanede görsel yok. Yukarıdan yükleyin.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {library.data?.map((m) => {
              const isSelected = selected.includes(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelected((prev) => (isSelected ? prev.filter((id) => id !== m.id) : [...prev, m.id]))}
                    className={cn(
                      "group relative block w-full overflow-hidden rounded-md border-2 text-left",
                      isSelected ? "border-teal" : "border-transparent hover:border-input",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.altText} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                    <span className="block truncate px-1.5 py-1 text-xs text-muted-foreground">{m.altText || "Alt metin yok"}</span>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-teal text-white">
                        <Check aria-hidden className="size-3.5" />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <DialogFooter>
        <button
          type="button"
          disabled={chosen.length === 0}
          onClick={() => onSelect(chosen)}
          className={actionVariants({ variant: "dark", size: "sm" })}
        >
          Ekle{chosen.length > 0 ? ` (${chosen.length})` : ""}
        </button>
      </DialogFooter>
    </div>
  );
}
