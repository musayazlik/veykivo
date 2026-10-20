import { Suspense } from "react";
import { SiteHeader, SiteHeaderFallback } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import NotFound from "./(site)/not-found";

/** Hiçbir rotayla eşleşmeyen adresler için; site başlığı ve altbilgisiyle birlikte gösterilir. */
export default function RootNotFound() {
  return (
    <>
      <Suspense fallback={<SiteHeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main id="icerik" className="landing-page flex-1">
        <NotFound />
      </main>
      <SiteFooter />
    </>
  );
}
