import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/site/logo";

export const metadata = { title: "Giriş" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="blueprint-dark relative hidden flex-col justify-between bg-ink p-12 text-on-ink lg:flex">
        <Logo tone="light" />
        <div>
          <p className="max-w-md text-h2">İçeriğinizi tek yerden yönetin.</p>
          <p className="mt-4 max-w-md text-on-ink-muted">
            Hizmetler, projeler, blog yazıları ve gelen teklif talepleri bu panelde.
          </p>
        </div>
        <p className="text-sm text-on-ink-muted">Bu alan yalnızca yetkili kullanıcılar içindir.</p>
      </div>
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-10 text-[1.9rem] font-bold tracking-[-0.02em] text-ink lg:mt-0">Panele giriş yapın</h1>
          <p className="mt-2 text-muted-foreground">Yönetici e-posta adresiniz ve parolanızla devam edin.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
