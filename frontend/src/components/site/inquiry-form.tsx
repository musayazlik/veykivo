"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleCheck, LoaderCircle } from "lucide-react";
import type { Problem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(1, "Adınızı yazın.").max(120),
  email: z.string().trim().min(1, "E-posta adresinizi yazın.").pipe(z.email("Geçerli bir e-posta adresi yazın.")),
  company: z.string().trim().max(160).optional(),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[0-9+()\s-]*$/, "Telefon numarası yalnızca rakam ve + ( ) - içerebilir.")
    .optional(),
  serviceInterest: z.string().optional(),
  message: z.string().trim().min(20, "Projenizden en az 20 karakterle bahsedin.").max(4000),
  consent: z.literal(true, { error: "Devam etmek için KVKK aydınlatma metnini onaylayın." }),
  website: z.string().optional(),
});

type FormValues = z.input<typeof schema>;

export function InquiryForm({ services }: { services: string[] }) {
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { serviceInterest: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const res = await fetch("/api/v1/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, consent: values.consent === true }),
      });
      if (res.ok) {
        setStatus("sent");
        reset();
        return;
      }
      if (res.status === 429) {
        setFormError("Kısa sürede çok sayıda talep gönderildi. Birkaç dakika sonra tekrar deneyin.");
        return;
      }
      const problem = (await res.json().catch(() => ({}))) as Problem;
      if (problem.errors) {
        for (const [field, messages] of Object.entries(problem.errors)) {
          setError(field as keyof FormValues, { message: messages[0] });
        }
        setFormError("Formda düzeltilmesi gereken alanlar var.");
        return;
      }
      setFormError(problem.detail ?? "Talebiniz gönderilemedi. Lütfen tekrar deneyin.");
    } catch {
      setFormError("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    }
  });

  if (status === "sent") {
    return (
      <div role="status" className="landing-panel p-8 md:p-10">
        <CircleCheck aria-hidden className="size-10 text-[#a1b7ff]" />
        <h3 className="mt-5 text-[1.35rem] tracking-[-0.02em]">Talebiniz bize ulaştı.</h3>
        <p className="max-w-md">
          Ekibimiz talebinizi inceleyip en geç bir iş günü içinde e-posta veya telefonla size dönüş yapacak.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-8 text-[13px] font-semibold text-[#a1b7ff] underline-offset-4 hover:underline"
        >
          Yeni bir talep gönder
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      {/* Honeypot: ekran okuyuculardan ve görünümden gizli; botlar doldurur. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Web sitesi
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <Field label="Adınız soyadınız" error={errors.name?.message} required>
        {(p) => <input {...p} autoComplete="name" {...register("name")} />}
      </Field>
      <Field label="E-posta" error={errors.email?.message} required>
        {(p) => <input {...p} type="email" autoComplete="email" {...register("email")} />}
      </Field>
      <Field label="Şirket" error={errors.company?.message}>
        {(p) => <input {...p} autoComplete="organization" {...register("company")} />}
      </Field>
      <Field label="Telefon" error={errors.phone?.message}>
        {(p) => <input {...p} type="tel" autoComplete="tel" {...register("phone")} />}
      </Field>
      <Field label="İlgilendiğiniz hizmet" error={errors.serviceInterest?.message} className="sm:col-span-2">
        {(p) => (
          <select {...p} {...register("serviceInterest")}>
            <option value="">Henüz emin değilim</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field
        label="Projenizden bahsedin"
        hint="Hangi süreci iyileştirmek istiyorsunuz, kimler kullanacak, bir zaman planınız var mı?"
        error={errors.message?.message}
        className="sm:col-span-2"
        required
      >
        {(p) => <textarea {...p} rows={6} {...register("message")} />}
      </Field>

      <div className="sm:col-span-2">
        <label className="flex items-start gap-3 text-[14px] leading-relaxed">
          <input
            type="checkbox"
            className="mt-1 size-5 shrink-0 accent-[#5a6fd8]"
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            {...register("consent")}
          />
          <span className="text-[#3c4150]">
            Kişisel verilerimin talebime dönüş yapılması amacıyla işlenmesine ilişkin{" "}
            <Link href="/kvkk" target="_blank" className="font-medium text-[#3d56c9] underline underline-offset-3">
              KVKK aydınlatma metnini
            </Link>{" "}
            okudum.
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" className="mt-2 text-[13px] text-[#b44848]">
            {errors.consent.message}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="rounded-xl border border-[#e5b4b4] bg-[#fdf1f1] px-4 py-3 text-[14px] text-[#b44848] sm:col-span-2">
          {formError}
        </p>
      )}

      <div className="sm:col-span-2">
        <button type="submit" disabled={isSubmitting} className={cn("landing-btn-solid w-full sm:w-auto")}>
          {isSubmitting && <LoaderCircle aria-hidden className="animate-spin" />}
          {isSubmitting ? "Gönderiliyor" : "Talebi gönder"}
        </button>
      </div>
    </form>
  );
}

type FieldControlProps = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
  className: string;
  required?: boolean;
};

function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: FieldControlProps) => React.ReactNode;
}) {
  const id = `f-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[14px] font-medium text-[#3c4150]">
        {label}
        {required ? <span className="text-[#c25555]"> *</span> : <span className="font-normal text-[#878da0]"> (isteğe bağlı)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mb-2 text-[13px] text-[#878da0]">
          {hint}
        </p>
      )}
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
        required,
        className: "landing-input",
      })}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] text-[#b44848]">
          {error}
        </p>
      )}
    </div>
  );
}
