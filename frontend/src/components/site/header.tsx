"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { ActionLink } from "./action-link";
import { flatNav, mainNav, quoteHref } from "@/lib/site";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const base = href.split("/").slice(0, 2).join("/");
  return pathname === href || pathname.startsWith(`${base}/`) || pathname === base;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const submenuRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sayfa değişince menüler kapanır (render sırasında önceki adresle karşılaştırılır).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
    setSubmenuOpen(false);
  }

  useEffect(() => {
    document.documentElement.style.overflow = mobileOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setSubmenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    if (!submenuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!submenuRef.current?.contains(e.target as Node)) setSubmenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [submenuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        scrolled && !mobileOpen ? "bg-paper/85 shadow-[0_1px_0_var(--line)] backdrop-blur-md" : "bg-transparent",
      )}
    >
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-on-ink"
      >
        İçeriğe geç
      </a>
      <div className="container-x flex h-(--header-h) items-center justify-between gap-6">
        <Link href="/" aria-label="Veykivo ana sayfa" className="relative z-50 rounded-sm">
          <Logo tone={mobileOpen ? "light" : "ink"} />
        </Link>

        <nav aria-label="Ana menü" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) =>
              item.children ? (
                <li
                  key={item.href}
                  ref={submenuRef}
                  className="relative"
                  onMouseEnter={() => setSubmenuOpen(true)}
                  onMouseLeave={() => setSubmenuOpen(false)}
                >
                  <button
                    type="button"
                    aria-expanded={submenuOpen}
                    aria-controls="kurumsal-menu"
                    onClick={() => setSubmenuOpen((v) => !v)}
                    className={cn(
                      "relative flex items-center gap-1 rounded-md px-3 py-2 text-[0.95rem] font-medium text-ink/80 transition-colors hover:text-ink",
                      isActive(pathname, "/kurumsal") && "text-ink",
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      aria-hidden
                      className={cn("size-4 transition-transform duration-200", submenuOpen && "rotate-180")}
                    />
                    {isActive(pathname, "/kurumsal") && <ActiveDot />}
                  </button>
                  <div
                    id="kurumsal-menu"
                    className={cn(
                      "absolute top-full left-0 pt-2 transition-[opacity,transform] duration-200",
                      submenuOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
                    )}
                  >
                    <ul className="notch notch-sm w-72 border border-line bg-white p-2 shadow-[0_18px_40px_-20px_rgb(14_42_47/0.35)]">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block rounded-sm px-3 py-2.5 transition-colors hover:bg-mist"
                            aria-current={pathname === child.href ? "page" : undefined}
                          >
                            <span className="block font-semibold text-ink">{child.label}</span>
                            <span className="block text-sm leading-snug text-muted-foreground">{child.description}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={cn(
                      "relative block rounded-md px-3 py-2 text-[0.95rem] font-medium text-ink/80 transition-colors hover:text-ink",
                      isActive(pathname, item.href) && "text-ink",
                    )}
                  >
                    {item.label}
                    {isActive(pathname, item.href) && <ActiveDot />}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ActionLink href={quoteHref} size="sm" className="hidden sm:inline-flex">
            Teklif al
          </ActionLink>
          <button
            type="button"
            className={cn(
              "relative z-50 inline-flex size-11 items-center justify-center rounded-md lg:hidden",
              mobileOpen ? "text-on-ink" : "text-ink",
            )}
            aria-expanded={mobileOpen}
            aria-controls="mobil-menu"
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      <MobileMenu open={mobileOpen} pathname={pathname} />
    </header>
  );
}

/** Statik kabuktaki yer tutucu: aynı yükseklik ve logo, menü etkileşimi hidrasyonla gelir. */
export function SiteHeaderFallback() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="container-x flex h-(--header-h) items-center justify-between gap-6">
        <Link href="/" aria-label="Veykivo ana sayfa">
          <Logo />
        </Link>
        <ActionLink href={quoteHref} size="sm" className="hidden sm:inline-flex">
          Teklif al
        </ActionLink>
      </div>
    </header>
  );
}

function ActiveDot() {
  return <span aria-hidden className="absolute -bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-signal" />;
}

function MobileMenu({ open, pathname }: { open: boolean; pathname: string }) {
  const links = flatNav;
  return (
    <div
      id="mobil-menu"
      className={cn(
        "blueprint-dark fixed inset-0 z-40 flex flex-col bg-ink pt-(--header-h) transition-[opacity,visibility] duration-300 lg:hidden",
        open ? "visible opacity-100" : "invisible opacity-0",
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <nav aria-label="Mobil menü" className="container-x flex flex-1 flex-col justify-between overflow-y-auto pt-6 pb-10">
        <ul className="space-y-1">
          {links.map((link, i) => (
            <li
              key={link.href}
              style={{ transitionDelay: open ? `${80 + i * 40}ms` : "0ms" }}
              className={cn(
                "transition-[opacity,transform] duration-500 ease-(--ease-out-quart)",
                open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              )}
            >
              <Link
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "block py-2 text-[1.85rem] font-bold tracking-tight text-on-ink/75 transition-colors hover:text-on-ink",
                  pathname === link.href && "text-on-ink",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <ActionLink href={quoteHref} size="lg" className="mt-10 w-full">
          Teklif al
        </ActionLink>
      </nav>
    </div>
  );
}
