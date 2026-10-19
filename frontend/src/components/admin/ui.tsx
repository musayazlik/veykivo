"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { actionVariants } from "@/components/site/action-link";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PageHeader({
  title,
  description,
  backHref,
  newHref,
  newLabel,
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  newHref?: string;
  newLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      {backHref && (
        <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> Listeye dön
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold tracking-[-0.02em] text-ink">{title}</h1>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {children}
          {newHref && (
            <Link href={newHref} className={actionVariants({ variant: "dark", size: "sm" })}>
              <Plus aria-hidden /> {newLabel ?? "Yeni ekle"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function PublishBadge({ published, draftLabel = "Taslak" }: { published: boolean; draftLabel?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        published ? "bg-teal/10 text-teal" : "bg-mist text-muted-foreground",
      )}
    >
      <span className={cn("size-1.5 rounded-full", published ? "bg-teal" : "bg-muted-foreground/60")} />
      {published ? "Yayında" : draftLabel}
    </span>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20" aria-busy="true">
      <LoaderCircle aria-label="Yükleniyor" className="size-6 animate-spin text-teal" />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-destructive">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 text-sm font-semibold underline underline-offset-4">
          Tekrar dene
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, text, href, cta }: { title: string; text: string; href?: string; cta?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-input bg-white px-6 py-14 text-center">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {href && (
        <Link href={href} className={cn(actionVariants({ variant: "dark", size: "sm" }), "mt-5")}>
          <Plus aria-hidden /> {cta}
        </Link>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Özet kartları

export function StatGrid({ items }: { items: { label: string; value: number | string; hint?: string; tone?: "default" | "signal" }[] }) {
  return (
    <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((s) => (
        <div
          key={s.label}
          className={cn(
            "rounded-lg border p-4",
            s.tone === "signal" ? "border-signal/60 bg-signal/10" : "border-line bg-white",
          )}
        >
          <dt className="text-sm text-muted-foreground">{s.label}</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums text-ink">{s.value}</dd>
          {s.hint && <dd className="mt-0.5 truncate text-xs text-muted-foreground">{s.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

// ------------------------------------------------------------------ Onay penceresi

/** Satır aksiyonlarından açılan, kontrollü onay penceresi. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Kalıcı olarak sil",
  destructive = true,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose className={actionVariants({ variant: "outline", size: "sm" })}>Vazgeç</DialogClose>
          <button
            type="button"
            disabled={busy}
            className={cn(actionVariants({ variant: destructive ? "primary" : "dark", size: "sm" }), destructive && "bg-destructive text-white hover:bg-destructive/90")}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onOpenChange(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <LoaderCircle aria-hidden className="animate-spin" />}
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------ Silme onayı

export function DeleteButton({
  itemName,
  onConfirm,
  label = "Sil",
}: {
  itemName: string;
  onConfirm: () => Promise<unknown>;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(actionVariants({ variant: "outline", size: "sm" }), "border-destructive/30 text-destructive hover:border-destructive hover:bg-destructive hover:text-white")}
      >
        <Trash2 aria-hidden /> {label}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>&quot;{itemName}&quot; silinsin mi?</DialogTitle>
            <DialogDescription>Bu işlem geri alınamaz. Yalnızca yayından kaldırmak istiyorsanız kaydı taslağa alın.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose className={actionVariants({ variant: "outline", size: "sm" })}>Vazgeç</DialogClose>
            <button
              type="button"
              disabled={busy}
              className={cn(actionVariants({ size: "sm" }), "bg-destructive text-white hover:bg-destructive/90")}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm();
                  setOpen(false);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy && <LoaderCircle aria-hidden className="animate-spin" />}
              Kalıcı olarak sil
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SubmitBar({ isSubmitting, isNew, extra }: { isSubmitting: boolean; isNew: boolean; extra?: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
      <div>{extra}</div>
      <button type="submit" disabled={isSubmitting} className={actionVariants({ variant: "dark" })}>
        {isSubmitting && <LoaderCircle aria-hidden className="animate-spin" />}
        {isNew ? "Oluştur" : "Değişiklikleri kaydet"}
      </button>
    </div>
  );
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

