import { PageHero } from "./page-hero";
import { Markdown } from "./markdown";

/** Yasal metinler için ortak yerleşim. Metinler yayın öncesi şirketin hukuk danışmanınca onaylanmalıdır. */
export function LegalPage({ title, updated, body }: { title: string; updated: string; body: string }) {
  return (
    <>
      <PageHero title={title} crumbs={[{ label: title }]} lead={`Son güncelleme: ${updated}`} />
      <section className="container-x pb-24">
        <div
          role="note"
          className="mb-10 max-w-3xl rounded-md border border-signal/60 bg-signal/10 px-5 py-4 text-[0.95rem] text-ink"
        >
          Bu metin taslaktır. Yayına almadan önce şirket bilgileriyle güncellenip hukuk danışmanınızca onaylanmalıdır.
        </div>
        <Markdown className="max-w-3xl">{body}</Markdown>
      </section>
    </>
  );
}
