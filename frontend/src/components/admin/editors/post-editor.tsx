"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ExternalLink, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { adminApi, errorMessage, unwrap } from "@/lib/api/browser";
import type { AdminCategory, AiGenerateResult, Media } from "@/lib/api/types";
import { DeleteButton, ErrorState, LoadingState, PageHeader, SubmitBar } from "../ui";
import { Field, Section, Toggle, inputClass } from "../form";
import RichTextEditor from "../editor/rich-text-editor";
import { MediaPicker } from "../media-picker";
import { DateTimePicker, MultiSelect, SelectField } from "../controls";
import { useContentMutation } from "../use-save";
import { orNull, slugSchema } from "./common";
import { PostStatusBadge, postStateOf } from "./post-status";
import { AiGenerateDialog, AiRewriteMenu } from "../blog/ai-tools";
import { CategoryDialog, categoriesKey, tagsKey } from "../blog/taxonomy-dialogs";
import { actionVariants } from "@/components/site/action-link";
import { cn } from "@/lib/utils";

type PublishMode = "draft" | "now" | "schedule";

const schema = z
  .object({
    version: z.uuid().nullable(),
    title: z.string().trim().min(1, "Başlık zorunlu.").max(200),
    slug: slugSchema,
    excerpt: z.string().trim().min(1, "Özet zorunlu.").max(400),
    bodyMarkdown: z.string().max(100000),
    coverImageId: z.string().nullable(),
    categoryId: z.string().nullable(),
    tagIds: z.array(z.string()).max(10, "En fazla 10 etiket."),
    isFeatured: z.boolean(),
    publishMode: z.enum(["draft", "now", "schedule"]),
    scheduledAt: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.publishMode === "draft") return;
    if (!v.categoryId) ctx.addIssue({ code: "custom", path: ["categoryId"], message: "Yayınlamak için bir kategori seçin." });
    if (v.tagIds.length === 0) ctx.addIssue({ code: "custom", path: ["tagIds"], message: "Yayınlamak için en az bir etiket ekleyin." });
    if (v.publishMode === "schedule") {
      if (!v.scheduledAt) ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "Yayın tarihini seçin." });
      else if (new Date(v.scheduledAt) <= new Date()) ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "Planlanan tarih gelecekte olmalı." });
    }
  });
type Values = z.infer<typeof schema>;

const empty: Values = {
  version: null, title: "", slug: "", excerpt: "", bodyMarkdown: "", coverImageId: null, categoryId: null, tagIds: [],
  isFeatured: false, publishMode: "draft", scheduledAt: "",
};

const listKey = ["admin", "posts"];

const trMap: Record<string, string> = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
/** Önizleme için; asıl slug sunucuda aynı kurallarla üretilir. */
function slugify(text: string) {
  return text
    .toLocaleLowerCase("tr")
    .replace(/[çğıİöşüâîû]/g, (c) => trMap[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export function PostEditor({ id }: { id: string | null }) {
  const queryClient = useQueryClient();
  const [aiOpen, setAiOpen] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [coverPreview, setCoverPreview] = useState<Media | null>(null);

  const query = useQuery({
    queryKey: [...listKey, id],
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/posts/{id}", { params: { path: { id: id! } } })),
    enabled: id !== null,
  });
  const categories = useQuery({ queryKey: categoriesKey, queryFn: () => unwrap(adminApi.GET("/api/v1/admin/categories")) });
  const tags = useQuery({ queryKey: tagsKey, queryFn: () => unwrap(adminApi.GET("/api/v1/admin/tags")) });

  const { register, handleSubmit, control, watch, reset, setValue, getValues, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: empty,
  });
  const errors = formState.errors;

  useEffect(() => {
    if (query.data && !formState.isDirty) {
      const p = query.data;
      const state = postStateOf(p.status, p.publishedAt);
      reset({
        version: p.version,
        title: p.title, slug: p.slug, excerpt: p.excerpt, bodyMarkdown: p.bodyMarkdown, coverImageId: p.coverImageId,
        categoryId: p.categoryId, tagIds: [...p.tagIds], isFeatured: p.isFeatured,
        publishMode: state === "draft" ? "draft" : state === "scheduled" ? "schedule" : "now",
        scheduledAt: state === "scheduled" && p.publishedAt ? format(new Date(p.publishedAt), "yyyy-MM-dd'T'HH:mm") : "",
      });
    }
  }, [query.data, reset, formState.isDirty]);

  // Slug, kullanıcı elle değiştirene kadar başlığı izler.
  const title = watch("title");
  useEffect(() => {
    if (!slugTouched) setValue("slug", slugify(title ?? ""));
  }, [title, slugTouched, setValue]);

  const categoryOptions = useMemo(
    () => (categories.data ?? []).map((c) => ({ value: c.id, label: c.name, color: c.color, hint: c.description ?? undefined })),
    [categories.data],
  );
  const tagOptions = useMemo(
    () => (tags.data ?? []).map((t) => ({ value: t.id, label: t.name, hint: String(t.postCount) })),
    [tags.data],
  );

  const save = useContentMutation({
    mutationFn: (v: Values) => {
      const published = query.data?.publishedAt && new Date(query.data.publishedAt) <= new Date() ? query.data.publishedAt : null;
      const body = {
        version: v.version,
        title: v.title,
        slug: orNull(v.slug),
        excerpt: v.excerpt,
        bodyMarkdown: v.bodyMarkdown,
        coverImageId: v.coverImageId,
        categoryId: v.categoryId,
        tagIds: v.tagIds,
        isFeatured: v.isFeatured,
        status: v.publishMode === "draft" ? ("Draft" as const) : ("Published" as const),
        // "Hemen": ilk yayın tarihi korunur; "Planla": seçilen ileri tarih.
        publishedAt: v.publishMode === "schedule" ? new Date(v.scheduledAt).toISOString() : v.publishMode === "now" ? published : null,
        // Panel artık SEO alanlarını göstermiyor; var olan değerler korunur.
        seoTitle: query.data?.seoTitle ?? null,
        seoDescription: query.data?.seoDescription ?? null,
      };
      return id
        ? unwrap(adminApi.PUT("/api/v1/admin/posts/{id}", { params: { path: { id } }, body }))
        : unwrap(adminApi.POST("/api/v1/admin/posts", { body }));
    },
    queryKey: listKey,
    tags: ["posts"],
    successMessage: id ? "Yazı kaydedildi." : "Yazı oluşturuldu.",
    redirectTo: "/admin/blog",
  });

  const remove = useContentMutation({
    mutationFn: () => unwrap(adminApi.DELETE("/api/v1/admin/posts/{id}", { params: { path: { id: id! } } })),
    queryKey: listKey,
    tags: ["posts"],
    successMessage: "Yazı silindi.",
    redirectTo: "/admin/blog",
  });

  const createTag = async (name: string) => {
    try {
      const tag = await unwrap(adminApi.POST("/api/v1/admin/tags", { body: { name, slug: null } }));
      await queryClient.invalidateQueries({ queryKey: tagsKey });
      const current = getValues("tagIds");
      if (!current.includes(tag.id)) setValue("tagIds", [...current, tag.id], { shouldDirty: true, shouldValidate: true });
      return tag;
    } catch (err) {
      toast.error(errorMessage(err));
      return null;
    }
  };

  /** AI sonucunu forma uygular; kategori/etiket adları mevcutlarla eşleştirilir, yoksa oluşturulur. */
  const applyAi = async (r: AiGenerateResult) => {
    const opts = { shouldDirty: true, shouldValidate: true } as const;
    if (r.title) setValue("title", r.title, opts);
    if (r.excerpt) setValue("excerpt", r.excerpt, opts);
    if (r.content) setValue("bodyMarkdown", r.content, opts);
    if (r.cover) {
      setCoverPreview({ id: r.cover.id, url: r.cover.url, altText: r.cover.altText });
      setValue("coverImageId", r.cover.id, opts);
    }
    if (r.category) {
      const existing = (categories.data ?? []).find((c) => c.name.toLocaleLowerCase("tr") === r.category!.toLocaleLowerCase("tr"));
      if (existing) setValue("categoryId", existing.id, opts);
      else {
        try {
          const created = await unwrap(adminApi.POST("/api/v1/admin/categories", { body: { name: r.category, slug: null, description: null, color: "#2F6F6A" } }));
          await queryClient.invalidateQueries({ queryKey: categoriesKey });
          setValue("categoryId", created.id, opts);
        } catch (err) {
          toast.error(`Kategori oluşturulamadı: ${errorMessage(err)}`);
        }
      }
    }
    for (const name of r.tags) await createTag(name);
  };

  if (id && query.isLoading) return <LoadingState />;
  if (id && (query.isError || !query.data)) return <ErrorState message="Yazı bulunamadı." />;

  const publishMode = watch("publishMode");

  return (
    <form onSubmit={handleSubmit((v) => save.mutateAsync(v))} noValidate>
      <PageHeader title={id ? query.data!.title : "Yeni yazı"} backHref="/admin/blog">
        {id && query.data && <PostStatusBadge status={query.data.status} publishedAt={query.data.publishedAt} />}
        {id && query.data && postStateOf(query.data.status, query.data.publishedAt) === "published" && (
          <a href={`/blog/${query.data.slug}`} target="_blank" className={actionVariants({ variant: "outline", size: "sm" })}>
            <ExternalLink aria-hidden /> Sitede gör
          </a>
        )}
        <button type="button" onClick={() => setAiOpen(true)} className={cn(actionVariants({ size: "sm" }))}>
          <Sparkles aria-hidden /> AI ile oluştur
        </button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-6">
          <Section title="Yazı">
            <Field label="Başlık" htmlFor="title" error={errors.title?.message}>
              <input id="title" className={cn(inputClass, "text-lg font-semibold")} aria-invalid={!!errors.title} {...register("title")} />
            </Field>
            <Field label="Özet" htmlFor="excerpt" error={errors.excerpt?.message} hint="Blog listesinde ve paylaşımlarda görünür.">
              <textarea id="excerpt" rows={2} className={inputClass} aria-invalid={!!errors.excerpt} {...register("excerpt")} />
            </Field>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="bodyMarkdown" className="text-sm font-medium text-ink">
                  İçerik
                </label>
                <AiRewriteMenu
                  getContent={() => ({ title: getValues("title"), excerpt: getValues("excerpt"), content: getValues("bodyMarkdown") })}
                  onApply={(r) => {
                    const opts = { shouldDirty: true } as const;
                    if (r.content) setValue("bodyMarkdown", r.content, opts);
                    if (r.title) setValue("title", r.title, opts);
                    if (r.excerpt) setValue("excerpt", r.excerpt, opts);
                  }}
                />
              </div>
              <Controller
                control={control}
                name="bodyMarkdown"
                render={({ field }) => (
                  <RichTextEditor
                    id="bodyMarkdown"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Yazının gövdesini yazın…"
                    label="İçerik"
                  />
                )}
              />
              {errors.bodyMarkdown && <p className="mt-1.5 text-sm text-destructive">{errors.bodyMarkdown.message}</p>}
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Yayın">
            <Controller
              control={control}
              name="publishMode"
              render={({ field }) => (
                <Field label="Yayın durumu" htmlFor="publishMode">
                  <SelectField<PublishMode>
                    id="publishMode"
                    value={field.value}
                    onChange={(v) => v && field.onChange(v)}
                    options={[
                      { value: "draft", label: "Taslak olarak kaydet", hint: "Sitede görünmez" },
                      { value: "now", label: "Hemen yayınla", hint: "Kaydedince yayına girer" },
                      { value: "schedule", label: "Yayını planla", hint: "Seçilen tarihte otomatik yayınlanır" },
                    ]}
                  />
                </Field>
              )}
            />
            {publishMode === "schedule" && (
              <Controller
                control={control}
                name="scheduledAt"
                render={({ field }) => (
                  <Field label="Yayın tarihi ve saati" htmlFor="scheduledAt" error={errors.scheduledAt?.message}>
                    <DateTimePicker id="scheduledAt" value={field.value} onChange={field.onChange} disablePast invalid={!!errors.scheduledAt} />
                  </Field>
                )}
              />
            )}
            <Toggle label="Öne çıkan yazı" description="Blog sayfasının başında büyük olarak gösterilir." {...register("isFeatured")} />
          </Section>

          <Section title="Düzenleme">
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Field label="Kategori" htmlFor="categoryId" error={errors.categoryId?.message}>
                  <SelectField
                    id="categoryId"
                    value={field.value}
                    onChange={field.onChange}
                    options={categoryOptions}
                    placeholder="Kategori seçin"
                    clearLabel="Kategorisiz"
                    invalid={!!errors.categoryId}
                  />
                  <button type="button" onClick={() => setCategoryDialog(true)} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-teal hover:underline">
                    <Plus aria-hidden className="size-3.5" /> Yeni kategori
                  </button>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="tagIds"
              render={({ field }) => (
                <Field label="Etiketler" htmlFor="tagIds" error={errors.tagIds?.message} hint="Listede yoksa yazıp Enter'a basarak oluşturun.">
                  <MultiSelect
                    id="tagIds"
                    value={field.value}
                    onChange={field.onChange}
                    options={tagOptions}
                    placeholder="Etiket ekleyin"
                    searchPlaceholder="Etiket ara veya oluştur"
                    onCreate={async (name) => void (await createTag(name))}
                    max={10}
                    invalid={!!errors.tagIds}
                  />
                </Field>
              )}
            />
          </Section>

          <Section title="Kapak görseli">
            <Controller
              control={control}
              name="coverImageId"
              render={({ field }) => (
                <MediaPicker value={field.value} initial={coverPreview ?? query.data?.coverImage} onChange={field.onChange} label="Görsel" />
              )}
            />
          </Section>

          <Section title="Adres">
            <Field label="Slug" htmlFor="slug" error={errors.slug?.message} hint={slugTouched ? "Elle düzenlendi." : "Başlıktan otomatik üretiliyor."}>
              <input
                id="slug"
                className={inputClass}
                aria-invalid={!!errors.slug}
                {...register("slug", { onChange: () => setSlugTouched(true) })}
              />
            </Field>
          </Section>
        </div>
      </div>

      <SubmitBar
        isSubmitting={formState.isSubmitting}
        isNew={!id}
        extra={id && <DeleteButton itemName={query.data!.title} onConfirm={() => remove.mutateAsync(undefined)} />}
      />

      <AiGenerateDialog open={aiOpen} onOpenChange={setAiOpen} initialTopic={title} onApply={applyAi} />
      <CategoryDialog
        open={categoryDialog}
        onOpenChange={setCategoryDialog}
        item={null}
        onSaved={(c: AdminCategory) => setValue("categoryId", c.id, { shouldDirty: true, shouldValidate: true })}
      />
    </form>
  );
}
