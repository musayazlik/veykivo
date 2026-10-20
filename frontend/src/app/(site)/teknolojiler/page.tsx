import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { getTechnologies } from "@/lib/api/content";
import { technologyCategoryLabels, type Technology, type TechnologyCategory } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Teknolojilerimiz",
  description: "Frontend, backend, mobil, veritabanı, altyapı ve yapay zekâ alanlarında kullandığımız teknolojiler.",
  alternates: { canonical: "/teknolojiler" },
};

const categoryNotes: Record<TechnologyCategory, string> = {
  Frontend: "Hızlı açılan, erişilebilir ve arama motorlarının kolayca okuyabildiği arayüzler.",
  Backend: "İş kurallarını taşıyan, test edilebilir ve uzun ömürlü servisler.",
  Mobile: "iOS ve Android için tek kod tabanından, çevrimdışı çalışabilen uygulamalar.",
  Database: "Verinin tutarlılığını koruyan, yedeklenen ve ölçeklenebilen veri katmanı.",
  Infrastructure: "Tekrarlanabilir kurulum, otomatik dağıtım ve izlenebilir sunucular.",
  AI: "Belge okuma, sınıflandırma ve öneri gibi işlerde ölçülebilir fayda sağlayan modeller.",
};

export default async function TechnologiesPage() {
  const technologies = await getTechnologies();
  const groups = technologies.reduce(
    (acc, t) => ((acc[t.category] ??= []).push(t), acc),
    {} as Partial<Record<TechnologyCategory, Technology[]>>,
  );
  const categories = (Object.keys(technologyCategoryLabels) as TechnologyCategory[]).filter((c) => groups[c]);

  return (
    <>
      <PageHero
        title="Doğru iş için doğru araç"
        lead="Teknoloji seçimini projenizin ömrü, ekibinizin yetkinliği ve bakım maliyeti belirler. Kullandığımız araçları ve neden tercih ettiğimizi aşağıda bulabilirsiniz."
        crumbs={[{ label: "Teknolojilerimiz" }]}
      />

      <section className="page-body">
        <div className="landing-shell">
          {categories.length === 0 ? (
            <p className="landing-empty">Teknoloji listesi yakında yayınlanacak.</p>
          ) : (
            <div>
              {categories.map((cat) => (
                <section key={cat} className="grid gap-6 border-t border-[#e0e3ee] py-10 first:border-t-0 md:grid-cols-12 md:gap-10">
                  <div className="md:col-span-4">
                    <h2 className="text-[1.3rem] tracking-[-0.02em] text-[#171922]">{technologyCategoryLabels[cat]}</h2>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#646a7c]">{categoryNotes[cat]}</p>
                  </div>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:col-span-8">
                    {groups[cat]!.map((t) => (
                      <li key={t.id} className="landing-tech-item">
                        {t.name}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>

      <CtaBand
        title="Mevcut bir sisteminiz mi var?"
        text="Teknolojiyi değiştirmek her zaman gerekmez. Mevcut yapınızı inceleyip modernizasyon için en az riskli yolu öneriyoruz."
      />
    </>
  );
}
