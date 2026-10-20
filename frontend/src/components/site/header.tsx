"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
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
    <header className={cn("landing-header fixed inset-x-0 top-0 z-50", scrolled && !mobileOpen && "is-scrolled")}>
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-[#141722] focus:px-4 focus:py-2 focus:text-[#f5f6fa]"
      >
        İçeriğe geç
      </a>
      <div className="container-x flex h-(--header-h) items-center justify-between gap-6">
        <Link href="/" aria-label="Veykivo ana sayfa" className="relative z-50 rounded-sm">
          <Logo tone="light" />
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
                    className="relative flex items-center gap-1 rounded-md px-3 py-2 transition-colors"
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
                    <ul className="w-80 rounded-2xl border border-white/10 bg-[#101319] p-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)]">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
                            aria-current={pathname === child.href ? "page" : undefined}
                          >
                            <span className="block font-semibold text-[#f5f6fb]">{child.label}</span>
                            <span className="mt-0.5 block text-[13px] leading-snug text-[#8a91a7]">{child.description}</span>
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
                    className="relative block rounded-md px-3 py-2 transition-colors"
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
          <ActionLink href={quoteHref} size="sm" className="landing-nav-cta hidden sm:inline-flex">
            Teklif al
          </ActionLink>
          <button
            type="button"
            className="relative z-50 inline-flex size-11 items-center justify-center rounded-md text-[#d5d8e2] lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobil-menu"
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      <MobileMenu open={mobileOpen} pathname={pathname} onOpenChange={setMobileOpen} />
    </header>
  );
}

/** Statik kabuktaki yer tutucu: aynı yükseklik ve logo, menü etkileşimi hidrasyonla gelir. */
export function SiteHeaderFallback() {
  return (
    <header className="landing-header fixed inset-x-0 top-0 z-50">
      <div className="container-x flex h-(--header-h) items-center justify-between gap-6">
        <Link href="/" aria-label="Veykivo ana sayfa">
          <Logo tone="light" />
        </Link>
        <ActionLink href={quoteHref} size="sm" className="landing-nav-cta hidden sm:inline-flex">
          Teklif al
        </ActionLink>
      </div>
    </header>
  );
}

function ActiveDot() {
  return <span aria-hidden className="bg-signal absolute -bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full" />;
}

function MobileMenu({ open, pathname, onOpenChange }: { open: boolean; pathname: string; onOpenChange: (open: boolean) => void }) {
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) onOpenChange(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="mobil-menu" className="site-mobile-dialog" showCloseButton={false}>
        <DialogTitle className="sr-only">Site menüsü</DialogTitle>
        <DialogDescription className="sr-only">Sayfalar arasında gezinmek için bir bağlantı seçin.</DialogDescription>
        <div className="flex h-[72px] shrink-0 items-center justify-between px-5">
          <Link href="/" aria-label="Veykivo ana sayfa" onClick={() => onOpenChange(false)}><Logo tone="light" /></Link>
          <DialogClose className="inline-flex size-11 items-center justify-center rounded-md" aria-label="Menüyü kapat"><X aria-hidden className="size-6" /></DialogClose>
        </div>
        <nav aria-label="Mobil menü" className="flex flex-1 flex-col overflow-y-auto px-6 pt-7 pb-10">
          <ul className="space-y-1">
            {flatNav.map((link) => <li key={link.href}>
              <Link href={link.href} onClick={() => onOpenChange(false)} aria-current={pathname === link.href ? "page" : undefined}
                className={cn("block py-2 text-[1.85rem] font-medium tracking-tight text-white/70 transition-colors hover:text-white", pathname === link.href && "text-white")}>
                {link.label}
              </Link>
            </li>)}
          </ul>
          <Link href={quoteHref} onClick={() => onOpenChange(false)} className="mt-10 flex min-h-14 items-center justify-center rounded-full bg-white px-6 font-medium text-[#12141d]">Projenizi konuşalım</Link>
        </nav>
      </DialogContent>
    </Dialog>
  );
}
