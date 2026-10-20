// Sunucu şablonu, alt sayfalardaki Suspense sınırlarının anında gezinme
// doğrulaması sırasında da çizilmesini sağlar. Geçiş hareketi CSS ile uygulanır.
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="site-page-transition">{children}</div>;
}
