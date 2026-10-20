import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { quoteHref } from "@/lib/site";

/** Sayfaların kapanışındaki koyu CTA bandı; ana sayfanın iletişim bölümüyle aynı dilde. */
export function CtaBand({
  title = "Projenizi 30 dakikalık bir görüşmede konuşalım.",
  text = "İhtiyacınızı dinliyor, size uygun yaklaşımı ve kabaca bir yol haritasını aynı görüşmede paylaşıyoruz. Bağlayıcı değil, ücretsiz.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="landing-contact landing-contact--band" aria-labelledby="cta-title">
      <div className="landing-contact-orbit" aria-hidden="true" />
      <div className="landing-shell">
        <p className="landing-kicker">Sıradaki adım.</p>
        <h2 id="cta-title">{title}</h2>
        <p>{text}</p>
        <div className="flex flex-wrap justify-center gap-5">
          <Link href={quoteHref} className="landing-button landing-button-light">
            Tanışalım <span><ArrowUpRight aria-hidden /></span>
          </Link>
          <Link href="/projeler" className="landing-outline-link">
            Projeleri incele <ArrowUpRight aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
