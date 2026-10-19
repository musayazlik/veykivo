import { Suspense } from "react";
import { SiteHeader, SiteHeaderFallback } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Aktif menü öğesi URL'den okunur; bilinmeyen dinamik adreslerde statik kabuk bu yedekle çizilir. */}
      <Suspense fallback={<SiteHeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main id="icerik" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
