import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./logo";
import { getServices, getSiteSettings } from "@/lib/api/content";
import { flatNav } from "@/lib/site";

export async function SiteFooter() {
  const [settings, services] = await Promise.all([getSiteSettings(), getServices()]);
  const pages = flatNav.filter((i) => i.href !== "/");

  return (
    <footer className="blueprint-dark mt-auto bg-ink text-on-ink">
      <div className="container-x grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <Logo tone="light" />
          <p className="mt-5 max-w-xs text-on-ink-muted">{settings.tagline}</p>
          <ul className="mt-8 space-y-3 text-[0.95rem]">
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} className="link-underline inline-flex items-center gap-2.5">
                  <Mail aria-hidden className="size-4 text-signal" />
                  {settings.email}
                </a>
              </li>
            )}
            {settings.phone && (
              <li>
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="link-underline inline-flex items-center gap-2.5">
                  <Phone aria-hidden className="size-4 text-signal" />
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.address && (
              <li className="flex items-start gap-2.5 text-on-ink-muted">
                <MapPin aria-hidden className="mt-1 size-4 shrink-0 text-signal" />
                <span>{settings.address}</span>
              </li>
            )}
          </ul>
        </div>

        <nav aria-label="Hizmetler" className="md:col-span-3 md:col-start-6">
          <h2 className="text-sm font-semibold text-on-ink-muted">Hizmetler</h2>
          <ul className="mt-4 space-y-2.5">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/hizmetler/${s.slug}`} className="link-underline">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Site haritası" className="md:col-span-2">
          <h2 className="text-sm font-semibold text-on-ink-muted">Sayfalar</h2>
          <ul className="mt-4 space-y-2.5">
            {pages.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="link-underline">
                  {p.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/iletisim" className="link-underline">
                İletişim
              </Link>
            </li>
          </ul>
        </nav>

        {settings.social.length > 0 && (
          <nav aria-label="Sosyal medya" className="md:col-span-2">
            <h2 className="text-sm font-semibold text-on-ink-muted">Takip edin</h2>
            <ul className="mt-4 space-y-2.5">
              {settings.social.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="link-underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-3 py-6 text-sm text-on-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CopyrightYear /> {settings.companyName}. Tüm hakları saklıdır.
          </p>
          <ul className="flex gap-5">
            <li>
              <Link href="/kvkk" className="link-underline">
                KVKK aydınlatma metni
              </Link>
            </li>
            <li>
              <Link href="/gizlilik-politikasi" className="link-underline">
                Gizlilik politikası
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

/** Yıl, önbellekteki statik kabukla birlikte üretilir; yılda bir değişmesi yeterli. */
async function CopyrightYear() {
  "use cache";
  return <>{new Date().getFullYear()}</>;
}
