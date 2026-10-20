import { Suspense } from "react";
import { AdminSidebar, AdminSidebarFallback } from "@/components/admin/sidebar";
import { DemoBanner } from "@/components/admin/demo-banner";

/**
 * Panel düzeni: URL'ye bağlı kenar çubuğu kendi Suspense sınırında çözülür,
 * sayfa içeriği dışarıda kalır ve her zaman render edilir (anlık navigasyon doğrulanabilir).
 * Oturumsuz erişim proxy'de, yetki ise her istekte API'de kontrol edilir.
 */
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <Suspense fallback={<AdminSidebarFallback />}>
        <AdminSidebar />
      </Suspense>
      <div className="min-w-0 pt-14 lg:pt-0">
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
          <DemoBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
