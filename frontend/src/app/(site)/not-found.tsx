import { ActionLink } from "@/components/site/action-link";

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[70vh] flex-col justify-center pt-[calc(var(--header-h)+3rem)] pb-24">
      <p className="text-[6rem] leading-none font-extrabold tracking-[-0.05em] text-ink/15 md:text-[9rem]">404</p>
      <h1 className="mt-4 text-h1 text-ink">Bu sayfa bulunamadı</h1>
      <p className="mt-5 max-w-xl text-lead text-muted-foreground">
        Aradığınız sayfa taşınmış veya yayından kaldırılmış olabilir. Ana sayfadan devam edebilir ya da bize doğrudan
        yazabilirsiniz.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <ActionLink href="/">Ana sayfaya dön</ActionLink>
        <ActionLink href="/iletisim" variant="outline">
          İletişime geç
        </ActionLink>
      </div>
    </section>
  );
}
