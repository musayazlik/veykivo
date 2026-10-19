"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenText,
  Boxes,
  ChevronDown,
  Cpu,
  ExternalLink,
  FolderKanban,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { adminApi, refreshCsrfToken, unwrap } from "@/lib/api/browser";
import { cn } from "@/lib/utils";

type NavLeaf = { href: string; label: string; badge?: "inquiries" | "comments" };
type NavItem = NavLeaf & { icon: LucideIcon; children?: NavLeaf[] };

const nav: NavItem[] = [
  { href: "/admin", label: "Genel bakış", icon: LayoutDashboard },
  { href: "/admin/talepler", label: "Talepler", icon: Inbox, badge: "inquiries" },
  { href: "/admin/hizmetler", label: "Hizmetler", icon: Boxes },
  { href: "/admin/projeler", label: "Projeler", icon: FolderKanban },
  {
    href: "/admin/blog",
    label: "Blog",
    icon: BookOpenText,
    badge: "comments",
    children: [
      { href: "/admin/blog", label: "Yazılar" },
      { href: "/admin/blog/kategoriler", label: "Kategoriler" },
      { href: "/admin/blog/etiketler", label: "Etiketler" },
      { href: "/admin/blog/yorumlar", label: "Yorumlar", badge: "comments" },
    ],
  },
  { href: "/admin/ekip", label: "Ekip", icon: Users },
  { href: "/admin/teknolojiler", label: "Teknolojiler", icon: Cpu },
  { href: "/admin/medya", label: "Medya", icon: Images },
  { href: "/admin/ayarlar", label: "Site ayarları", icon: Settings },
];

/** Alt menüsü olan bölümlerde en uzun eşleşen yol aktif sayılır (/admin/blog vs /admin/blog/kategoriler). */
function activeLeaf(pathname: string, leaves: NavLeaf[]) {
  return leaves
    .filter((l) => pathname === l.href || pathname.startsWith(`${l.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

/**
 * Panel kenar çubuğu ve mobil üst çubuk. URL'ye bağlı olduğu için layout'ta kendi Suspense sınırında
 * çizilir; sayfa içeriği bu bileşenin dışında kalır ve her zaman render edilir.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const me = useQuery({ queryKey: ["me"], queryFn: () => unwrap(adminApi.GET("/api/v1/auth/me")), retry: false });
  const summary = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/dashboard")),
    enabled: me.isSuccess,
  });
  const badges: Record<NonNullable<NavLeaf["badge"]>, number> = {
    inquiries: summary.data?.newInquiries ?? 0,
    comments: summary.data?.pendingComments ?? 0,
  };

  const logout = async () => {
    await adminApi.POST("/api/v1/auth/logout");
    await refreshCsrfToken();
    router.replace("/admin/giris");
  };

  const topActive = activeLeaf(pathname, nav);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur lg:hidden">
        <button type="button" aria-label="Menüyü aç" onClick={() => setOpen(true)} className="-ml-1 rounded-md p-2 hover:bg-mist">
          <Menu className="size-5" />
        </button>
        <Logo className="scale-90" />
      </header>

      {open && <div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink text-on-ink transition-transform duration-300 ease-(--ease-out-quart) lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/admin" aria-label="Panel ana sayfa">
            <Logo tone="light" />
          </Link>
          <button type="button" className="rounded-md p-1 lg:hidden" aria-label="Menüyü kapat" onClick={() => setOpen(false)}>
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Panel menüsü" className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-0.5">
            {nav.map((item) =>
              item.children ? (
                <NavGroup key={item.href} item={item} pathname={pathname} badges={badges} />
              ) : (
                <li key={item.href}>
                  <NavLink href={item.href} icon={item.icon} active={topActive === item.href} badge={item.badge && badges[item.badge]}>
                    {item.label}
                  </NavLink>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-4 text-sm">
          {me.data ? (
            <>
              <p className="truncate text-on-ink">{me.data.displayName ?? "Yönetici"}</p>
              <p className="truncate text-on-ink-muted">{me.data.email}</p>
            </>
          ) : (
            <div aria-hidden className="space-y-2">
              <div className="h-3.5 w-24 animate-pulse rounded bg-white/10" />
              <div className="h-3.5 w-40 animate-pulse rounded bg-white/10" />
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <a
              href="/"
              target="_blank"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-white/15 px-2 py-1.5 text-on-ink-muted transition-colors hover:border-white/30 hover:text-on-ink"
            >
              <ExternalLink aria-hidden className="size-3.5" /> Siteyi aç
            </a>
            <button
              type="button"
              onClick={logout}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-white/15 px-2 py-1.5 text-on-ink-muted transition-colors hover:border-white/30 hover:text-on-ink"
            >
              <LogOut aria-hidden className="size-3.5" /> Çıkış
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavLink({
  href,
  icon: Icon,
  active,
  badge,
  nested,
  children,
}: {
  href: string;
  icon?: LucideIcon;
  active: boolean;
  badge?: number;
  nested?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-md px-3 text-[0.95rem] transition-colors",
        nested ? "py-2 pl-10 text-[0.9rem]" : "py-2.5",
        active ? "bg-white/10 font-medium text-on-ink" : "text-on-ink-muted hover:bg-white/5 hover:text-on-ink",
      )}
    >
      {nested && (
        <span aria-hidden className={cn("absolute left-[1.35rem] size-1.5 rounded-full", active ? "bg-signal" : "bg-white/25")} />
      )}
      {Icon && <Icon aria-hidden className={cn("size-4.5", active && "text-signal")} />}
      <span className="flex-1">{children}</span>
      {!!badge && (
        <span className="rounded-full bg-signal px-2 text-xs font-bold tabular-nums text-ink">
          {badge}
          <span className="sr-only"> bekleyen</span>
        </span>
      )}
    </Link>
  );
}

function NavGroup({
  item,
  pathname,
  badges,
}: {
  item: NavItem;
  pathname: string;
  badges: Record<NonNullable<NavLeaf["badge"]>, number>;
}) {
  const children = item.children!;
  const current = activeLeaf(pathname, children);
  const [expanded, setExpanded] = useState(Boolean(current));
  const [prevCurrent, setPrevCurrent] = useState(current);
  if (prevCurrent !== current) {
    setPrevCurrent(current);
    if (current) setExpanded(true);
  }
  const Icon = item.icon;
  const id = `nav-${item.href.replaceAll("/", "-")}`;

  return (
    <li>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[0.95rem] transition-colors",
          current ? "text-on-ink" : "text-on-ink-muted hover:bg-white/5 hover:text-on-ink",
        )}
      >
        <Icon aria-hidden className={cn("size-4.5", current && "text-signal")} />
        <span className="flex-1">{item.label}</span>
        {!expanded && item.badge && !!badges[item.badge] && (
          <span className="rounded-full bg-signal px-2 text-xs font-bold tabular-nums text-ink">{badges[item.badge]}</span>
        )}
        <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-200", expanded && "rotate-180")} />
      </button>
      <div
        id={id}
        className={cn("grid transition-[grid-template-rows] duration-300 ease-(--ease-out-quart)", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
      >
        <ul className="overflow-hidden" inert={!expanded}>
          {children.map((leaf) => (
            <li key={leaf.href} className="mt-0.5">
              <NavLink href={leaf.href} nested active={current === leaf.href} badge={leaf.badge && badges[leaf.badge]}>
                {leaf.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export function AdminSidebarFallback() {
  return <aside aria-hidden className="hidden bg-ink lg:sticky lg:top-0 lg:block lg:h-screen" />;
}
