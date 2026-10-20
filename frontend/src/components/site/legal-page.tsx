import { PageHero } from "./page-hero";
import { Markdown } from "./markdown";

/** Yasal metinler için ortak yerleşim. Metinler yayın öncesi şirketin hukuk danışmanınca onaylanmalıdır. */
export function LegalPage({ title, updated, body }: { title: string; updated: string; body: string }) {
  return (
    <>
      <PageHero title={title} crumbs={[{ label: title }]} lead={`Son güncelleme: ${updated}`} />
      <section className="page-body">
        <div className="landing-shell">
          <div
            role="note"
            className="mb-10 max-w-3xl rounded-xl border border-[#bec9ee] bg-[#f0f3fc] px-5 py-4 text-[14px] leading-relaxed text-[#3c4150]"
          >
            Bu metin taslaktır. Yayına almadan önce şirket bilgileriyle güncellenip hukuk danışmanınızca onaylanmalıdır.
          </div>
          <Markdown className="max-w-3xl">{body}</Markdown>
        </div>
      </section>
    </>
  );
}
