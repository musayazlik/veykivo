import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { InquiryForm } from "@/components/site/inquiry-form";
import { getServices, getSiteSettings } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "İletişim ve teklif",
  description: "Projeniz için teklif alın veya Veykivo ekibiyle iletişime geçin. En geç bir iş günü içinde dönüş yapıyoruz.",
  alternates: { canonical: "/iletisim" },
};

export default async function ContactPage() {
  const [settings, services] = await Promise.all([getSiteSettings(), getServices()]);

  const channels = [
    settings.email && { icon: Mail, label: "E-posta", value: settings.email, href: `mailto:${settings.email}` },
    settings.phone && { icon: Phone, label: "Telefon", value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, "")}` },
    settings.address && { icon: MapPin, label: "Adres", value: settings.address },
    settings.workingHours && { icon: Clock, label: "Çalışma saatleri", value: settings.workingHours },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <>
      <PageHero
        title="Projenizi konuşalım"
        lead="Kısa bir form doldurun, ihtiyacınızı anlamak için sizi arayalım. İlk görüşme ücretsiz ve bağlayıcı değil."
        crumbs={[{ label: "İletişim" }]}
      />

      <section className="container-x grid gap-14 pb-24 lg:grid-cols-12 lg:gap-16">
        <aside className="lg:col-span-4">
          <h2 className="text-h3 text-ink">İletişim bilgileri</h2>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {channels.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex gap-4 py-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-mist text-teal">
                  <Icon aria-hidden className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  {href ? (
                    <a href={href} className="font-medium text-ink underline-offset-4 hover:underline">
                      {value}
                    </a>
                  ) : (
                    <p className="font-medium text-ink">{value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <h2 className="text-h3 text-ink">Sonrasında ne olur?</h2>
            <ol className="mt-5 space-y-4">
              {[
                "Talebinizi inceleyip bir iş günü içinde size dönüyoruz.",
                "30 dakikalık bir görüşmede ihtiyacınızı ve önceliklerinizi dinliyoruz.",
                "Kapsam, yaklaşım ve tahmini bütçeyi içeren yazılı bir öneri paylaşıyoruz.",
              ].map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-signal text-sm font-bold text-ink">
                    {i + 1}
                  </span>
                  <span className="text-ink/85">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <div id="teklif-formu" className="notch scroll-mt-28 border border-line bg-white p-6 sm:p-10 lg:col-span-8">
          <h2 className="text-h2 text-ink">Teklif formu</h2>
          <p className="mt-3 mb-8 text-muted-foreground">Yıldızlı alanlar zorunludur.</p>
          <InquiryForm services={services.map((s) => s.title)} />
        </div>
      </section>
    </>
  );
}
