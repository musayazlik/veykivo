"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="page-hero flex min-h-[76vh] flex-col justify-center">
      <div className="page-hero-glow" aria-hidden="true" />
      <div className="landing-shell">
        <div className="hero-rise">
          <h1 className="!max-w-none">Sayfa şu anda yüklenemedi.</h1>
          <p className="page-lead">
            Geçici bir sorun oluştu. Sayfayı yeniden deneyin; sorun sürerse kısa süre sonra tekrar ziyaret edin.
          </p>
          {error.digest && <p className="mt-4 text-[13px] text-[#747a8f]">Hata kodu: {error.digest}</p>}
          <div className="page-hero-actions">
            <button type="button" onClick={reset} className="landing-button landing-button-light">
              Yeniden dene <span><ArrowUpRight aria-hidden /></span>
            </button>
            <Link href="/" className="landing-outline-link">
              Ana sayfaya dön <ArrowUpRight aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
