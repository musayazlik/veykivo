/** Detay sayfalarının statik kabuğunda, içerik akarken gösterilen iskelet. */
export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="İçerik yükleniyor" className="container-x animate-pulse pt-[calc(var(--header-h)+3.5rem)] pb-24">
      <div className="h-4 w-48 rounded bg-mist" />
      <div className="mt-10 h-14 w-3/4 max-w-3xl rounded bg-mist" />
      <div className="mt-4 h-14 w-1/2 max-w-xl rounded bg-mist" />
      <div className="mt-8 h-5 w-2/3 max-w-2xl rounded bg-mist" />
      <div className="mt-14 aspect-[21/9] w-full rounded bg-mist" />
    </div>
  );
}
