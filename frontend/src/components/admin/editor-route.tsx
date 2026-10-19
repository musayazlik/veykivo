import { Suspense } from "react";
import { LoadingState } from "./ui";

/**
 * Düzenleyici sayfaları için ortak sarmalayıcı: dinamik [id] parametresi Suspense içinde çözülür
 * (Cache Components kuralı), "yeni" değeri yeni kayıt anlamına gelir.
 */
export function EditorRoute({
  params,
  render,
}: {
  params: Promise<{ id: string }>;
  render: (id: string | null) => React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <Resolve params={params} render={render} />
    </Suspense>
  );
}

async function Resolve({ params, render }: { params: Promise<{ id: string }>; render: (id: string | null) => React.ReactNode }) {
  const { id } = await params;
  return <>{render(id === "yeni" ? null : id)}</>;
}
