import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function NotFound() {
  return (
    <section className="page-hero flex min-h-[76vh] flex-col justify-center">
      <div className="page-hero-glow" aria-hidden="true" />
      <div className="landing-shell">
        <div className="hero-rise">
          <p className="landing-kicker !text-[#7b859e]">404</p>
          <h1 className="!max-w-none">Bu sayfa bulunamadı.</h1>
          <p className="page-lead">
            Aradığınız sayfa taşınmış veya yayından kaldırılmış olabilir. Ana sayfadan devam edebilir ya da bize doğrudan
            yazabilirsiniz.
          </p>
          <div className="page-hero-actions">
            <Link href="/" className="landing-button landing-button-light">
              Ana sayfaya dön <span><ArrowUpRight aria-hidden /></span>
            </Link>
            <Link href="/iletisim" className="landing-outline-link">
              İletişime geç <ArrowUpRight aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
