"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExternalLink } from "lucide-react";
import { adminApi, unwrap } from "@/lib/api/browser";
import { technologyCategoryLabels } from "@/lib/api/types";
import { DeleteButton, ErrorState, LoadingState, PageHeader, SubmitBar } from "../ui";
import { Field, Section, Toggle, inputClass } from "../form";
import { NumberField, SeoFields } from "../fields";
import { MediaPicker } from "../media-picker";
import { useContentMutation } from "../use-save";
import { orNull, seoSchema, slugSchema, sortOrderSchema } from "./common";
import { cn } from "@/lib/utils";

const schema = z.object({
  version: z.uuid().nullable(),
  title: z.string().trim().min(1, "Başlık zorunlu.").max(160),
  slug: slugSchema,
  clientName: z.string().max(160),
  sector: z.string().max(80),
  summary: z.string().trim().min(1, "Özet zorunlu.").max(400),
  challenge: z.string().max(8000),
  solution: z.string().max(8000),
  outcome: z.string().max(8000),
  coverImageId: z.string().nullable(),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: sortOrderSchema,
  technologyIds: z.array(z.string()),
  ...seoSchema,
});
type Values = z.infer<typeof schema>;

const empty: Values = {
  version: null,
  title: "", slug: "", clientName: "", sector: "", summary: "", challenge: "", solution: "", outcome: "",
  coverImageId: null, isPublished: false, isFeatured: false, sortOrder: 0, technologyIds: [], seoTitle: "", seoDescription: "",
};

const listKey = ["admin", "projects"];

export function ProjectEditor({ id }: { id: string | null }) {
  const query = useQuery({
    queryKey: [...listKey, id],
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/projects/{id}", { params: { path: { id: id! } } })),
    enabled: id !== null,
  });
  const technologies = useQuery({
    queryKey: ["admin", "technologies"],
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/technologies")),
  });

  const { register, handleSubmit, control, watch, reset, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  const errors = formState.errors;

  useEffect(() => {
    if (query.data && !formState.isDirty) {
      const p = query.data;
      reset({
        version: p.version,
        title: p.title, slug: p.slug, clientName: p.clientName ?? "", sector: p.sector ?? "", summary: p.summary,
        challenge: p.challenge, solution: p.solution, outcome: p.outcome, coverImageId: p.coverImageId,
        isPublished: p.isPublished, isFeatured: p.isFeatured, sortOrder: p.sortOrder, technologyIds: [...p.technologyIds],
        seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "",
      });
    }
  }, [query.data, reset, formState.isDirty]);

  const save = useContentMutation({
    mutationFn: (v: Values) => {
      const body = {
        ...v, slug: orNull(v.slug), clientName: orNull(v.clientName), sector: orNull(v.sector),
        seoTitle: orNull(v.seoTitle), seoDescription: orNull(v.seoDescription),
      };
      return id
        ? unwrap(adminApi.PUT("/api/v1/admin/projects/{id}", { params: { path: { id } }, body }))
        : unwrap(adminApi.POST("/api/v1/admin/projects", { body }));
    },
    queryKey: listKey,
    tags: ["projects"],
    successMessage: id ? "Proje kaydedildi." : "Proje oluşturuldu.",
    redirectTo: "/admin/projeler",
  });

  const remove = useContentMutation({
    mutationFn: () => unwrap(adminApi.DELETE("/api/v1/admin/projects/{id}", { params: { path: { id: id! } } })),
    queryKey: listKey,
    tags: ["projects"],
    successMessage: "Proje silindi.",
    redirectTo: "/admin/projeler",
  });

  if (id && query.isLoading) return <LoadingState />;
  if (id && (query.isError || !query.data)) return <ErrorState message="Proje bulunamadı." />;

  return (
    <form onSubmit={handleSubmit((v) => save.mutateAsync(v))} noValidate>
      <PageHeader title={id ? query.data!.title : "Yeni proje"} backHref="/admin/projeler">
        {id && query.data?.isPublished && (
          <a href={`/projeler/${query.data.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:underline">
            <ExternalLink aria-hidden className="size-4" /> Sitede gör
          </a>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Section title="Genel bilgiler">
            <Field label="Proje başlığı" htmlFor="title" error={errors.title?.message}>
              <input id="title" className={inputClass} aria-invalid={!!errors.title} {...register("title")} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Müşteri adı" htmlFor="clientName" hint="Referans izni yoksa boş bırakın.">
                <input id="clientName" className={inputClass} {...register("clientName")} />
              </Field>
              <Field label="Sektör" htmlFor="sector">
                <input id="sector" className={inputClass} placeholder="Lojistik" {...register("sector")} />
              </Field>
            </div>
            <Field label="Kısa özet" htmlFor="summary" error={errors.summary?.message}>
              <textarea id="summary" rows={3} className={inputClass} aria-invalid={!!errors.summary} {...register("summary")} />
            </Field>
          </Section>

          <Section title="Vaka anlatımı" description="Sitede İhtiyaç, Çözüm ve Sonuç başlıklarıyla gösterilir.">
            <Field label="İhtiyaç" htmlFor="challenge" hint="Müşterinin yaşadığı sorun neydi?">
              <textarea id="challenge" rows={5} className={inputClass} {...register("challenge")} />
            </Field>
            <Field label="Çözüm" htmlFor="solution" hint="Ne geliştirdiniz, nasıl yaklaştınız?">
              <textarea id="solution" rows={5} className={inputClass} {...register("solution")} />
            </Field>
            <Field label="Sonuç" htmlFor="outcome" hint="Neler değişti? Doğrulanmış verilerle yazın.">
              <textarea id="outcome" rows={4} className={inputClass} {...register("outcome")} />
            </Field>
          </Section>

          <Section title="Kullanılan teknolojiler">
            {technologies.isLoading ? (
              <p className="text-sm text-muted-foreground">Yükleniyor…</p>
            ) : (
              <Controller
                control={control}
                name="technologyIds"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {technologies.data?.map((t) => {
                      const checked = field.value.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          title={technologyCategoryLabels[t.category]}
                          className={cn(
                            "cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-teal/30",
                            checked ? "border-teal bg-teal text-white" : "border-line bg-white text-ink hover:border-input",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            onChange={() => field.onChange(checked ? field.value.filter((x) => x !== t.id) : [...field.value, t.id])}
                          />
                          {t.name}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            )}
          </Section>

          <Section title="Arama motoru (SEO)">
            <SeoFields register={register} watch={watch} errors={errors} />
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Yayın">
            <Toggle label="Yayında" description="Kapalıysa sitede görünmez." {...register("isPublished")} />
            <Toggle label="Ana sayfada öne çıkar" description="Ana sayfada en fazla 3 proje gösterilir." {...register("isFeatured")} />
            <NumberField id="sortOrder" label="Sıra" {...register("sortOrder", { valueAsNumber: true })} />
            <Field label="Adres (slug)" htmlFor="slug" error={errors.slug?.message} hint="Boş bırakılırsa başlıktan üretilir.">
              <input id="slug" className={inputClass} aria-invalid={!!errors.slug} {...register("slug")} />
            </Field>
          </Section>
          <Section title="Kapak görseli">
            <Controller
              control={control}
              name="coverImageId"
              render={({ field }) => <MediaPicker value={field.value} initial={query.data?.coverImage} onChange={field.onChange} label="Görsel" />}
            />
          </Section>
        </div>
      </div>

      <SubmitBar
        isSubmitting={formState.isSubmitting}
        isNew={!id}
        extra={id && <DeleteButton itemName={query.data!.title} onConfirm={() => remove.mutateAsync(undefined)} />}
      />
    </form>
  );
}
