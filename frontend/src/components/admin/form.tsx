"use client";

import { cn } from "@/lib/utils";

export const inputClass =
  "block w-full rounded-md border border-input bg-white px-3 py-2 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-teal focus:ring-3 focus:ring-teal/20 aria-invalid:border-destructive disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  );
}

/** Erişilebilir aç/kapa anahtarı (native checkbox üzerine). */
export function Toggle({
  label,
  description,
  ...props
}: { label: string; description?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" role="switch" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-input transition-colors peer-checked:bg-teal peer-focus-visible:ring-3 peer-focus-visible:ring-teal/30 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
      />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
    </label>
  );
}

export function Section({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-line bg-white p-5 md:p-6", className)}>
      <h2 className="font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}
