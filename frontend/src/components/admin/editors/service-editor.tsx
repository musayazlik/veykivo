"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExternalLink } from "lucide-react";
import { adminApi, unwrap } from "@/lib/api/browser";
import { DeleteButton, ErrorState, LoadingState, PageHeader, SubmitBar } from "../ui";
import { Field, Section, Toggle, inputClass } from "../form";
import { MarkdownEditor, NumberField, SeoFields } from "../fields";
import { MediaPicker } from "../media-picker";
import { useContentMutation } from "../use-save";
import { orNull, seoSchema, slugSchema, sortOrderSchema } from "./common";
import { ServiceIcon, serviceIconNames } from "@/components/site/service-icon";
import { cn } from "@/lib/utils";

const schema = z.object({
  version: z.uuid().nullable(),
  title: z.string().trim().min(1, "Başlık zorunlu.").max(160),
  slug: slugSchema,
  summary: z.string().trim().min(1, "Özet zorunlu.").max(400),
  body: z.string().max(20000),
  icon: z.string(),
  coverImageId: z.string().nullable(),
  sortOrder: sortOrderSchema,
  isPublished: z.boolean(),
  ...seoSchema,
});
type Values = z.infer<typeof schema>;

const empty: Values = {
  version: null,
  title: "", slug: "", summary: "", body: "", icon: "layers", coverImageId: null,
  sortOrder: 0, isPublished: false, seoTitle: "", seoDescription: "",
};

const listKey = ["admin", "services"];

export function ServiceEditor({ id }: { id: string | null }) {
  const query = useQuery({
    queryKey: [...listKey, id],
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/services/{id}", { params: { path: { id: id! } } })),
    enabled: id !== null,
  });

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  const { register, handleSubmit, control, watch, reset, formState } = form;
  const errors = formState.errors;

  useEffect(() => {
    if (query.data && !formState.isDirty) {
      const s = query.data;
      reset({
        version: s.version,
        title: s.title, slug: s.slug, summary: s.summary, body: s.body, icon: s.icon ?? "layers",
        coverImageId: s.coverImageId, sortOrder: s.sortOrder, isPublished: s.isPublished,
        seoTitle: s.seoTitle ?? "", seoDescription: s.seoDescription ?? "",
      });
    }
  }, [query.data, reset, formState.isDirty]);

  const save = useContentMutation({
    mutationFn: (v: Values) => {
      const body = { ...v, slug: orNull(v.slug), icon: orNull(v.icon), seoTitle: orNull(v.seoTitle), seoDescription: orNull(v.seoDescription) };
      return id
        ? unwrap(adminApi.PUT("/api/v1/admin/services/{id}", { params: { path: { id } }, body }))
        : unwrap(adminApi.POST("/api/v1/admin/services", { body }));
    },
    queryKey: listKey,
    tags: ["services"],
    successMessage: id ? "Hizmet kaydedildi." : "Hizmet oluşturuldu.",
    redirectTo: "/admin/hizmetler",
  });

  const remove = useContentMutation({
    mutationFn: () => unwrap(adminApi.DELETE("/api/v1/admin/services/{id}", { params: { path: { id: id! } } })),
    queryKey: listKey,
    tags: ["services"],
    successMessage: "Hizmet silindi.",
    redirectTo: "/admin/hizmetler",
  });

  if (id && query.isLoading) return <LoadingState />;
  if (id && (query.isError || !query.data)) return <ErrorState message="Hizmet bulunamadı." />;

  const icon = watch("icon");

  return (
    <form onSubmit={handleSubmit((v) => save.mutateAsync(v))} noValidate>
      <PageHeader title={id ? query.data!.title : "Yeni hizmet"} backHref="/admin/hizmetler">
        {id && query.data?.isPublished && (
          <a href={`/hizmetler/${query.data.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:underline">
            <ExternalLink aria-hidden className="size-4" /> Sitede gör
          </a>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Section title="İçerik">
            <Field label="Başlık" htmlFor="title" error={errors.title?.message}>
              <input id="title" className={inputClass} aria-invalid={!!errors.title} {...register("title")} />
            </Field>
            <Field label="Kısa özet" htmlFor="summary" error={errors.summary?.message} hint="Listelerde ve arama sonuçlarında görünür.">
              <textarea id="summary" rows={3} className={inputClass} aria-invalid={!!errors.summary} {...register("summary")} />
            </Field>
            <Field label="Detay metni" htmlFor="body">
              <MarkdownEditor id="body" value={watch("body")} error={errors.body?.message} textareaProps={register("body")} />
            </Field>
          </Section>
          <Section title="Arama motoru (SEO)">
            <SeoFields register={register} watch={watch} errors={errors} />
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Yayın">
            <Toggle label="Yayında" description="Kapalıysa sitede görünmez." {...register("isPublished")} />
            <NumberField id="sortOrder" label="Sıra" hint="Küçük sayı önce listelenir." {...register("sortOrder", { valueAsNumber: true })} />
            <Field label="Adres (slug)" htmlFor="slug" error={errors.slug?.message} hint="Boş bırakılırsa başlıktan üretilir.">
              <input id="slug" className={inputClass} placeholder="ozel-yazilim-gelistirme" aria-invalid={!!errors.slug} {...register("slug")} />
            </Field>
          </Section>
          <Section title="Görsel ve ikon">
            <Controller
              control={control}
              name="coverImageId"
              render={({ field }) => <MediaPicker value={field.value} initial={query.data?.coverImage} onChange={field.onChange} />}
            />
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink">İkon</legend>
              <div className="grid grid-cols-5 gap-2">
                {serviceIconNames.map((name) => (
                  <label
                    key={name}
                    className={cn(
                      "flex aspect-square cursor-pointer items-center justify-center rounded-md border has-focus-visible:ring-3 has-focus-visible:ring-teal/30",
                      icon === name ? "border-teal bg-teal/10 text-teal" : "border-line text-ink/70 hover:border-input",
                    )}
                  >
                    <input type="radio" value={name} className="sr-only" {...register("icon")} />
                    <ServiceIcon name={name} className="size-5" />
                    <span className="sr-only">{name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
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
