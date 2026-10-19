import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };

export function PageHero({
  title,
  lead,
  crumbs = [],
  children,
  className,
}: {
  title: string;
  lead?: string;
  crumbs?: Crumb[];
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden pt-[calc(var(--header-h)+3.5rem)] pb-14 md:pb-20", className)}>
      <div
        aria-hidden
        className="blueprint pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
      />
      <div className="container-x relative">
        {crumbs.length > 0 && (
          <nav aria-label="Konum" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-ink">
                  Ana sayfa
                </Link>
              </li>
              {crumbs.map((c) => (
                <li key={c.label} className="flex items-center gap-1.5">
                  <ChevronRight aria-hidden className="size-3.5" />
                  {c.href ? (
                    <Link href={c.href} className="hover:text-ink">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-ink">
                      {c.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="hero-rise max-w-4xl">
          <h1 className="text-h1 text-ink">{title}</h1>
          {lead && <p className="mt-6 max-w-2xl text-lead text-muted-foreground">{lead}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
