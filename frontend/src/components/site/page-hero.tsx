import Link from "next/link";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };

/** İç sayfaların koyu hero'su: ana sayfadaki ritmi (nokta ızgara + büyük tipografi) taşır. */
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
    <section className={cn("page-hero", className)}>
      <div className="page-hero-glow" aria-hidden="true" />
      <div className="landing-shell relative">
        {crumbs.length > 0 && (
          <nav aria-label="Konum">
            <ol className="page-crumb">
              <li>
                <Link href="/">Ana sayfa</Link>
              </li>
              {crumbs.map((c) => (
                <li key={c.label}>
                  {c.href ? (
                    <Link href={c.href}>{c.label}</Link>
                  ) : (
                    <span aria-current="page" className="text-[#c9cddd]">
                      {c.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="hero-rise">
          <h1>{title}</h1>
          {lead && <p className="page-lead">{lead}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
