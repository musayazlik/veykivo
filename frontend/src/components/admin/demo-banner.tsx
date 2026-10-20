"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { adminApi, unwrap } from "@/lib/api/browser";

/**
 * Demo hesabı paneli salt okunur gezer. Yazma istekleri API'de reddedilir ve hata bildirimi olarak görünür;
 * bu bant kullanıcıya bunun beklenen davranış olduğunu baştan söyler. Kenar çubuğuyla aynı "me" sorgusunu paylaşır.
 */
export function DemoBanner() {
  const me = useQuery({ queryKey: ["me"], queryFn: () => unwrap(adminApi.GET("/api/v1/auth/me")), retry: false });
  if (!me.data?.roles.includes("Demo") || me.data.roles.includes("Admin")) return null;

  return (
    <div role="status" className="mb-6 flex items-start gap-3 rounded-lg border border-signal/40 bg-signal/10 px-4 py-3 text-sm text-ink">
      <Eye aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p>
        <span className="font-semibold">Demo modu.</span> Paneldeki her şeyi inceleyebilirsiniz; kaydetme, silme ve yükleme
        işlemleri bu hesapta devre dışıdır.
      </p>
    </div>
  );
}
