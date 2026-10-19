"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { adminApi, unwrap } from "@/lib/api/browser";
import { DeleteButton, ErrorState, LoadingState, PageHeader, SubmitBar } from "../ui";
import { Field, Section, Toggle, inputClass } from "../form";
import { NumberField } from "../fields";
import { MediaPicker } from "../media-picker";
import { useContentMutation } from "../use-save";
import { orNull, sortOrderSchema } from "./common";

const schema = z.object({
  version: z.uuid().nullable(),
  name: z.string().trim().min(1, "Ad zorunlu.").max(120),
  roleTitle: z.string().trim().min(1, "Unvan zorunlu.").max(120),
  bio: z.string().max(1200),
  photoId: z.string().nullable(),
  linkedInUrl: z.union([z.literal(""), z.url("Geçerli bir bağlantı girin (https://...).")]),
  sortOrder: sortOrderSchema,
  isPublished: z.boolean(),
});
type Values = z.infer<typeof schema>;

const empty: Values = {
  version: null, name: "", roleTitle: "", bio: "", photoId: null, linkedInUrl: "", sortOrder: 0, isPublished: true };
const listKey = ["admin", "team"];

export function TeamMemberEditor({ id }: { id: string | null }) {
  const query = useQuery({
    queryKey: [...listKey, id],
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/team/{id}", { params: { path: { id: id! } } })),
    enabled: id !== null,
  });

  const { register, handleSubmit, control, reset, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  const errors = formState.errors;

  useEffect(() => {
    if (query.data && !formState.isDirty) {
      const m = query.data;
      reset({ version: m.version, name: m.name, roleTitle: m.roleTitle, bio: m.bio, photoId: m.photoId, linkedInUrl: m.linkedInUrl ?? "", sortOrder: m.sortOrder, isPublished: m.isPublished });
    }
  }, [query.data, reset, formState.isDirty]);

  const save = useContentMutation({
    mutationFn: (v: Values) => {
      const body = { ...v, linkedInUrl: orNull(v.linkedInUrl) };
      return id
        ? unwrap(adminApi.PUT("/api/v1/admin/team/{id}", { params: { path: { id } }, body }))
        : unwrap(adminApi.POST("/api/v1/admin/team", { body }));
    },
    queryKey: listKey,
    tags: ["team"],
    successMessage: id ? "Kişi kaydedildi." : "Kişi eklendi.",
    redirectTo: "/admin/ekip",
  });

  const remove = useContentMutation({
    mutationFn: () => unwrap(adminApi.DELETE("/api/v1/admin/team/{id}", { params: { path: { id: id! } } })),
    queryKey: listKey,
    tags: ["team"],
    successMessage: "Kişi silindi.",
    redirectTo: "/admin/ekip",
  });

  if (id && query.isLoading) return <LoadingState />;
  if (id && (query.isError || !query.data)) return <ErrorState message="Kişi bulunamadı." />;

  return (
    <form onSubmit={handleSubmit((v) => save.mutateAsync(v))} noValidate>
      <PageHeader title={id ? query.data!.name : "Yeni ekip üyesi"} backHref="/admin/ekip" />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Section title="Kişi bilgileri">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Ad soyad" htmlFor="name" error={errors.name?.message}>
              <input id="name" className={inputClass} aria-invalid={!!errors.name} {...register("name")} />
            </Field>
            <Field label="Unvan" htmlFor="roleTitle" error={errors.roleTitle?.message}>
              <input id="roleTitle" className={inputClass} aria-invalid={!!errors.roleTitle} {...register("roleTitle")} />
            </Field>
          </div>
          <Field label="Kısa tanıtım" htmlFor="bio" error={errors.bio?.message} hint="2–3 cümle yeterli.">
            <textarea id="bio" rows={4} className={inputClass} {...register("bio")} />
          </Field>
          <Field label="LinkedIn profili" htmlFor="linkedInUrl" error={errors.linkedInUrl?.message}>
            <input id="linkedInUrl" type="url" className={inputClass} placeholder="https://www.linkedin.com/in/..." aria-invalid={!!errors.linkedInUrl} {...register("linkedInUrl")} />
          </Field>
        </Section>
        <div className="space-y-6">
          <Section title="Görünürlük">
            <Toggle label="Sitede göster" {...register("isPublished")} />
            <NumberField id="sortOrder" label="Sıra" {...register("sortOrder", { valueAsNumber: true })} />
          </Section>
          <Section title="Fotoğraf">
            <Controller
              control={control}
              name="photoId"
              render={({ field }) => <MediaPicker value={field.value} initial={query.data?.photo} onChange={field.onChange} label="Portre" />}
            />
          </Section>
        </div>
      </div>
      <SubmitBar
        isSubmitting={formState.isSubmitting}
        isNew={!id}
        extra={id && <DeleteButton itemName={query.data!.name} onConfirm={() => remove.mutateAsync(undefined)} />}
      />
    </form>
  );
}
