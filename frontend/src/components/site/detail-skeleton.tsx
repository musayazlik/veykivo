/** Detay sayfalarının statik kabuğunda, içerik akarken gösterilen iskelet. */
export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="İçerik yükleniyor" className="animate-pulse">
      <div className="page-hero">
        <div className="landing-shell">
          <div className="h-3 w-44 rounded bg-[#1a1d27]" />
          <div className="mt-9 h-14 w-3/4 max-w-3xl rounded bg-[#1a1d27]" />
          <div className="mt-4 h-14 w-1/2 max-w-xl rounded bg-[#1a1d27]" />
          <div className="mt-8 h-4 w-2/3 max-w-2xl rounded bg-[#1a1d27]" />
        </div>
      </div>
      <div className="page-body">
        <div className="landing-shell">
          <div className="aspect-[21/9] w-full rounded-2xl bg-[#e3e7ef]" />
        </div>
      </div>
    </div>
  );
}
