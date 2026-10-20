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

      <section className="page-body">
        <div className="landing-shell grid gap-14 lg:grid-cols-12 lg:gap-16">
          <aside className="lg:col-span-4">
            <h2 className="text-[0.7rem] font-semibold tracking-[0.08em] text-[#878da0] uppercase">İletişim bilgileri</h2>
            <ul className="mt-4">
              {channels.map(({ icon: Icon, label, value, href }) => (
                <li key={label} className="flex gap-4 border-t border-[#e0e3ee] py-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e9edf9] text-[#53638d]">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <div>
                    <p className="text-[13px] text-[#878da0]">{label}</p>
                    {href ? (
                      <a href={href} className="text-[15px] font-medium text-[#171922] underline-offset-4 hover:text-[#3d56c9] hover:underline">
                        {value}
                      </a>
                    ) : (
                      <p className="text-[15px] font-medium text-[#171922]">{value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <h2 className="text-[0.7rem] font-semibold tracking-[0.08em] text-[#878da0] uppercase">Sonrasında ne olur?</h2>
              <ol className="mt-4 space-y-4">
                {[
                  "Talebinizi inceleyip bir iş günü içinde size dönüyoruz.",
                  "30 dakikalık bir görüşmede ihtiyacınızı ve önceliklerinizi dinliyoruz.",
                  "Kapsam, yaklaşım ve tahmini bütçeyi içeren yazılı bir öneri paylaşıyoruz.",
                ].map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#141722] text-[12px] font-semibold text-[#a1b7ff]">
                      {i + 1}
                    </span>
                    <span className="text-[14.5px] leading-relaxed text-[#3c4150]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          <div id="teklif-formu" className="scroll-mt-28 rounded-2xl border border-[#e5e6ef] bg-white p-6 sm:p-10 lg:col-span-8">
            <h2 className="text-[clamp(24px,2.2vw,32px)] tracking-[-0.03em]">Teklif formu</h2>
            <p className="mt-3 mb-8 text-[14px] text-[#878da0]">Yıldızlı alanlar zorunludur.</p>
            <InquiryForm services={services.map((s) => s.title)} />
          </div>
        </div>
      </section>
    </>
  );
}
