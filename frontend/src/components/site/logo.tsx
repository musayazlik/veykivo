import { cn } from "@/lib/utils";

/** Üç düğümün birleşerek "V" oluşturduğu işaret: ayrı sistemleri tek merkezde bağlamak. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <path d="M6 7 L16 25 L26 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="7" r="3.6" fill="currentColor" />
      <circle cx="26" cy="7" r="3.6" fill="currentColor" />
      <circle cx="16" cy="25" r="4.2" fill="var(--signal)" />
    </svg>
  );
}

export function Logo({ className, tone = "ink" }: { className?: string; tone?: "ink" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", tone === "light" ? "text-on-ink" : "text-ink", className)}>
      <LogoMark />
      <span className="text-[1.45rem] font-extrabold leading-none tracking-[-0.04em]">veykivo</span>
    </span>
  );
}
