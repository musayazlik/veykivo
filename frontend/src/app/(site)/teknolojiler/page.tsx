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

      <section className="container-x pb-8">
        {categories.length === 0 ? (
          <p className="border-t border-line py-10 text-muted-foreground">Teknoloji listesi yakında yayınlanacak.</p>
        ) : (
          <div className="border-t border-line">
            {categories.map((cat) => (
              <section key={cat} className="grid gap-6 border-b border-line py-10 md:grid-cols-12 md:gap-10">
                <div className="md:col-span-4">
                  <h2 className="text-h3 text-ink">{technologyCategoryLabels[cat]}</h2>
                  <p className="mt-2 text-muted-foreground">{categoryNotes[cat]}</p>
                </div>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:col-span-8">
                  {groups[cat]!.map((t) => (
                    <li
                      key={t.id}
                      className="flex min-h-16 items-center rounded-md border border-line bg-white px-4 font-semibold text-ink transition-colors hover:border-teal"
                    >
                      {t.name}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>

      <CtaBand
        title="Mevcut bir sisteminiz mi var?"
        text="Teknolojiyi değiştirmek her zaman gerekmez. Mevcut yapınızı inceleyip modernizasyon için en az riskli yolu öneriyoruz."
      />
    </>
  );
}
