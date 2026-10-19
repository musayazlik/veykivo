import { ActionLink } from "./action-link";
import { quoteHref } from "@/lib/site";

export function CtaBand({
  title = "Projenizi 30 dakikalık bir görüşmede konuşalım.",
  text = "İhtiyacınızı dinliyor, size uygun yaklaşımı ve kabaca bir yol haritasını aynı görüşmede paylaşıyoruz. Bağlayıcı değil, ücretsiz.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="container-x py-20 md:py-28">
      <div className="notch blueprint-dark relative overflow-hidden bg-ink px-6 py-14 text-on-ink sm:px-12 md:px-16 md:py-20">
        <svg
          aria-hidden
          viewBox="0 0 400 200"
          className="pointer-events-none absolute -right-10 -bottom-10 w-[28rem] text-on-ink/10 md:right-0"
        >
          <path d="M20 180 L120 60 L220 140 L320 30" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="120" cy="60" r="7" fill="currentColor" />
          <circle cx="220" cy="140" r="7" fill="currentColor" />
          <circle cx="320" cy="30" r="9" fill="var(--signal)" />
        </svg>
        <div className="relative max-w-2xl">
          <h2 className="text-h2">{title}</h2>
          <p className="mt-5 text-lead text-on-ink-muted">{text}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ActionLink href={quoteHref} size="lg">
              Teklif al
            </ActionLink>
            <ActionLink href="/projeler" size="lg" variant="outline-light">
              Projeleri incele
            </ActionLink>
          </div>
        </div>
      </div>
    </section>
  );
}
