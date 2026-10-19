"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle } from "lucide-react";
import { adminApi, errorMessage, refreshCsrfToken, unwrap } from "@/lib/api/browser";
import { actionVariants } from "@/components/site/action-link";
import { Field, inputClass } from "./form";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().trim().min(1, "E-posta adresinizi yazın.").pipe(z.email("Geçerli bir e-posta adresi yazın.")),
  password: z.string().min(1, "Parolanızı yazın."),
});

type Values = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await refreshCsrfToken();
      await unwrap(adminApi.POST("/api/v1/auth/login", { body: values }));
      // Oturum değişti; CSRF token'ı kullanıcıya bağlı olduğu için yenilenir.
      await refreshCsrfToken();
      const target = params.get("donus");
      router.replace(target?.startsWith("/admin") ? target : "/admin");
    } catch (err) {
      setError(errorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
      <Field label="E-posta" htmlFor="email" error={errors.email?.message}>
        <input id="email" type="email" autoComplete="username" className={inputClass} aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field label="Parola" htmlFor="password" error={errors.password?.message}>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={inputClass}
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </Field>
      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}
      <button type="submit" disabled={isSubmitting} className={cn(actionVariants({ variant: "dark" }), "w-full")}>
        {isSubmitting && <LoaderCircle aria-hidden className="animate-spin" />}
        {isSubmitting ? "Giriş yapılıyor" : "Giriş yap"}
      </button>
    </form>
  );
}
