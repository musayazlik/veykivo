export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type NavItem = { label: string; href: string; children?: { label: string; href: string; description: string }[] };

export const mainNav: NavItem[] = [
  { label: "Ana Sayfa", href: "/" },
  {
    label: "Kurumsal",
    href: "/kurumsal/hakkimizda",
    children: [
      { label: "Hakkımızda", href: "/kurumsal/hakkimizda", description: "Hikâyemiz, misyonumuz ve çalışma biçimimiz" },
      { label: "Ekibimiz", href: "/kurumsal/ekibimiz", description: "Projelerinizi geliştiren insanlar" },
    ],
  },
  { label: "Hizmetlerimiz", href: "/hizmetler" },
  { label: "Projelerimiz", href: "/projeler" },
  { label: "Teknolojilerimiz", href: "/teknolojiler" },
  { label: "Blog", href: "/blog" },
];

/** Alt menüler açılmış, tek seviyeli menü (mobil menü ve altbilgi için). */
export const flatNav: { label: string; href: string }[] = mainNav.flatMap((item) =>
  item.children ? item.children : [{ label: item.label, href: item.href }],
);

export const quoteHref = "/iletisim#teklif-formu";

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}
