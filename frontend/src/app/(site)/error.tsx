"use client";

import { useEffect } from "react";
import { actionVariants, ActionLink } from "@/components/site/action-link";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="container-x flex min-h-[70vh] flex-col justify-center pt-[calc(var(--header-h)+3rem)] pb-24">
      <h1 className="text-h1 text-ink">Sayfa şu anda yüklenemedi</h1>
      <p className="mt-5 max-w-xl text-lead text-muted-foreground">
        Geçici bir sorun oluştu. Sayfayı yeniden deneyin; sorun sürerse kısa süre sonra tekrar ziyaret edin.
      </p>
      {error.digest && <p className="mt-3 text-sm text-muted-foreground">Hata kodu: {error.digest}</p>}
      <div className="mt-10 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className={actionVariants()}>
          Yeniden dene
        </button>
        <ActionLink href="/" variant="outline">
          Ana sayfaya dön
        </ActionLink>
      </div>
    </section>
  );
}
