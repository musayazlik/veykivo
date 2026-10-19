"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { adminApi, unwrap } from "@/lib/api/browser";
import { ErrorState, LoadingState, PageHeader, SubmitBar } from "@/components/admin/ui";
import { Field, Section, Toggle, inputClass } from "@/components/admin/form";
import { useContentMutation } from "@/components/admin/use-save";
import { SelectField } from "@/components/admin/controls";
import { ModelPicker, depthOptions, languageOptions, styleOptions, useAiModels } from "@/components/admin/blog/ai-tools";
import type { AiModels } from "@/lib/api/types";
import { Controller, type Control } from "react-hook-form";
import { AlertTriangle, Sparkles } from "lucide-react";

type FieldDef = { key: string; label: string; hint?: string; type?: string; multiline?: boolean };

const groups: { title: string; description?: string; fields: FieldDef[] }[] = [
  {
    title: "Şirket",
    fields: [
      { key: "company.name", label: "Şirket adı" },
      { key: "company.tagline", label: "Kısa tanıtım cümlesi", hint: "Altbilgide logonun altında görünür." },
    ],
  },
  {
    title: "İletişim",
    fields: [
      { key: "contact.email", label: "E-posta", type: "email" },
      { key: "contact.phone", label: "Telefon", type: "tel" },
      { key: "contact.address", label: "Adres", multiline: true },
      { key: "contact.workingHours", label: "Çalışma saatleri" },
    ],
  },
  {
    title: "Sosyal medya",
    description: "Boş bırakılan hesaplar sitede gösterilmez.",
    fields: [
      { key: "social.linkedin", label: "LinkedIn", type: "url" },
      { key: "social.github", label: "GitHub", type: "url" },
      { key: "social.instagram", label: "Instagram", type: "url" },
      { key: "social.x", label: "X (Twitter)", type: "url" },
    ],
  },
  {
    title: "Arama motoru varsayılanları",
    fields: [
      { key: "seo.defaultTitle", label: "Ana sayfa başlığı", hint: "En fazla 60–70 karakter önerilir." },
      { key: "seo.defaultDescription", label: "Ana sayfa açıklaması", hint: "En fazla 160 karakter önerilir.", multiline: true },
    ],
  },
  {
    title: "Bildirimler",
    description: "Yeni talep geldiğinde bu adrese e-posta gönderilir (SMTP yapılandırılmış olmalı).",
    fields: [{ key: "notifications.inquiryEmail", label: "Bildirim e-postası", type: "email" }],
  },
];

// react-hook-form noktalı adları iç içe nesne sayar; anahtarlar form içinde "__" ile kodlanır.
const encode = (key: string) => key.replaceAll(".", "__");
const decode = (key: string) => key.replaceAll("__", ".");

export default function SettingsPage() {
  const query = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/site-settings")),
  });
  const { register, handleSubmit, reset, control, formState } = useForm<Record<string, string>>();
  const ai = useAiModels();

  useEffect(() => {
    if (query.data) reset(Object.fromEntries(Object.entries(query.data).map(([k, v]) => [encode(k), v])));
  }, [query.data, reset]);

  const save = useContentMutation({
    mutationFn: (values: Record<string, string>) =>
      unwrap(
        adminApi.PUT("/api/v1/admin/site-settings", {
          body: Object.fromEntries(Object.entries(values).map(([k, v]) => [decode(k), v ?? ""])),
        }),
      ),
    queryKey: ["admin", "settings"],
    tags: ["settings"],
    successMessage: "Site ayarları kaydedildi.",
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Ayarlar yüklenemedi." onRetry={() => query.refetch()} />;

  return (
    <form onSubmit={handleSubmit((v) => save.mutateAsync(v))} noValidate>
      <PageHeader title="Site ayarları" description="İletişim bilgileri, sosyal medya ve varsayılan SEO metinleri." />
      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map((g) => (
          <Section key={g.title} title={g.title} description={g.description}>
            {g.fields.map((f) => (
              <Field key={f.key} label={f.label} htmlFor={encode(f.key)} hint={f.hint}>
                {f.multiline ? (
                  <textarea id={encode(f.key)} rows={3} className={inputClass} {...register(encode(f.key))} />
                ) : (
                  <input id={encode(f.key)} type={f.type ?? "text"} className={inputClass} {...register(encode(f.key))} />
                )}
              </Field>
            ))}
          </Section>
        ))}
        <AiSettings control={control} ai={ai.data} />
      </div>
      <SubmitBar isSubmitting={formState.isSubmitting} isNew={false} />
    </form>
  );
}

/** Yapay zekâ varsayılanları: AI penceresinde seçim yapılmazsa bunlar kullanılır. */
function AiSettings({ control, ai }: { control: Control<Record<string, string>>; ai: AiModels | undefined }) {
  const researchModels = [
    { id: "native", name: "Yazım modeli (web eklentisiyle)", isFree: false, promptPricePerMillion: null, completionPricePerMillion: null },
    ...(ai?.text ?? []),
  ];
  return (
    <Section
      title="Yapay zekâ (OpenRouter)"
      description="Blog editöründeki AI özelliklerinin varsayılanları. Boş model, otomatik seçim anlamına gelir."
      className="lg:col-span-2"
    >
      {ai && !ai.configured && (
        <p role="alert" className="flex gap-2 rounded-md border border-signal/60 bg-signal/10 px-3 py-2.5 text-sm text-ink">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            OpenRouter anahtarı tanımlı değil. Sunucuda <code className="font-mono">OpenRouter__ApiKey</code> ortam değişkenini ayarlayın; modeller o zaman listelenir.
          </span>
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        {(
          [
            ["ai__textModel", "Metin modeli", ai?.text ?? []],
            ["ai__imageModel", "Görsel modeli", ai?.image ?? []],
            ["ai__researchModel", "Araştırma modeli", researchModels],
          ] as const
        ).map(([name, label, models]) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <Field label={label} htmlFor={name} hint={name === "ai__researchModel" ? "Boşsa perplexity/sonar-pro kullanılır." : undefined}>
                <ModelPicker id={name} value={field.value || null} onChange={(v) => field.onChange(v ?? "")} models={[...models]} autoLabel="Otomatik" />
              </Field>
            )}
          />
        ))}
        {(
          [
            ["ai__style", "Yazım stili", styleOptions, "informative"],
            ["ai__depth", "Uzunluk", depthOptions, "standard"],
            ["ai__language", "Dil", languageOptions, "tr"],
          ] as const
        ).map(([name, label, options, fallback]) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <Field label={label} htmlFor={name}>
                <SelectField id={name} value={field.value || fallback} onChange={(v) => field.onChange(v ?? "")} options={[...options]} />
              </Field>
            )}
          />
        ))}
      </div>
      <Controller
        control={control}
        name="ai__webSearch"
        render={({ field }) => (
          <Toggle
            label="Varsayılan olarak web'de araştır"
            description="Açıkken AI yazıları kaynaklarla desteklenir ve kaynakça eklenir."
            checked={field.value === "true"}
            onChange={(e) => field.onChange(e.target.checked ? "true" : "false")}
          />
        )}
      />
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles aria-hidden className="size-3.5" /> Model fiyatları OpenRouter kataloğundan, 1M token başına gösterilir.
      </p>
    </Section>
  );
}
