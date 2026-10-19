"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle } from "lucide-react";
import { adminApi, unwrap } from "@/lib/api/browser";
import type { AdminCategory, AdminTag } from "@/lib/api/types";
import { Field, inputClass } from "../form";
import { ColorField } from "../controls";
import { useContentMutation } from "../use-save";
import { slugSchema } from "../editors/common";
import { actionVariants } from "@/components/site/action-link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const categoriesKey = ["admin", "categories"];
export const tagsKey = ["admin", "tags"];

const categorySchema = z.object({
  name: z.string().trim().min(1, "Kategori adı zorunlu.").max(60),
  slug: slugSchema,
  description: z.string().max(200, "En fazla 200 karakter."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Renk #RRGGBB biçiminde olmalı."),
});
type CategoryValues = z.infer<typeof categorySchema>;

/** Kategori oluşturma/düzenleme; hem kategoriler sayfasında hem yazı editöründe kullanılır. */
export function CategoryDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AdminCategory | null;
  onSaved?: (category: AdminCategory) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <CategoryForm key={item?.id ?? "new"} item={item} onDone={() => onOpenChange(false)} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({ item, onDone, onSaved }: { item: AdminCategory | null; onDone: () => void; onSaved?: (c: AdminCategory) => void }) {
  const { register, handleSubmit, control, formState } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: item?.name ?? "",
      slug: item?.slug ?? "",
      description: item?.description ?? "",
      color: item?.color ?? "#2F6F6A",
    },
  });
  const errors = formState.errors;

  const save = useContentMutation({
    mutationFn: (v: CategoryValues) => {
      const body = { name: v.name, slug: v.slug || null, description: v.description || null, color: v.color };
      return item
        ? unwrap(adminApi.PUT("/api/v1/admin/categories/{id}", { params: { path: { id: item.id } }, body }))
        : unwrap(adminApi.POST("/api/v1/admin/categories", { body }));
    },
    queryKey: categoriesKey,
    tags: ["posts"],
    successMessage: item ? "Kategori kaydedildi." : "Kategori oluşturuldu.",
  });

  return (
    <form
      noValidate
      className="space-y-5"
      // Dialog bir başka formun (yazı editörü) içinde açılabilir; submit olayı portal üzerinden üst forma kabarmasın.
      onSubmit={(e) => {
        e.stopPropagation();
        void handleSubmit(async (v) => {
          const saved = await save.mutateAsync(v);
          onSaved?.(saved);
          onDone();
        })(e);
      }}
    >
      <DialogHeader>
        <DialogTitle>{item ? "Kategoriyi düzenle" : "Yeni kategori"}</DialogTitle>
        <DialogDescription>Kategoriler blogda filtre ve rozet olarak görünür.</DialogDescription>
      </DialogHeader>
      <Field label="Ad" htmlFor="cat-name" error={errors.name?.message}>
        <input id="cat-name" autoFocus className={inputClass} aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <Field label="Adres (slug)" htmlFor="cat-slug" error={errors.slug?.message} hint="Boş bırakılırsa addan üretilir.">
        <input id="cat-slug" className={inputClass} placeholder="dijital-donusum" aria-invalid={!!errors.slug} {...register("slug")} />
      </Field>
      <Field label="Açıklama" htmlFor="cat-desc" error={errors.description?.message}>
        <textarea id="cat-desc" rows={2} className={inputClass} {...register("description")} />
      </Field>
      <Field label="Renk" htmlFor="cat-color" error={errors.color?.message}>
        <Controller control={control} name="color" render={({ field }) => <ColorField id="cat-color" value={field.value} onChange={field.onChange} />} />
      </Field>
      <DialogFooter>
        <button type="button" onClick={onDone} className={actionVariants({ variant: "outline", size: "sm" })}>
          Vazgeç
        </button>
        <button type="submit" disabled={formState.isSubmitting} className={actionVariants({ variant: "dark", size: "sm" })}>
          {formState.isSubmitting && <LoaderCircle aria-hidden className="animate-spin" />}
          {item ? "Kaydet" : "Oluştur"}
        </button>
      </DialogFooter>
    </form>
  );
}

const tagSchema = z.object({ name: z.string().trim().min(1, "Etiket adı zorunlu.").max(40), slug: slugSchema });
type TagValues = z.infer<typeof tagSchema>;

export function TagDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (open: boolean) => void; item: AdminTag | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <TagForm key={item?.id ?? "new"} item={item} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function TagForm({ item, onDone }: { item: AdminTag | null; onDone: () => void }) {
  const { register, handleSubmit, formState } = useForm<TagValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: item?.name ?? "", slug: item?.slug ?? "" },
  });
  const errors = formState.errors;
  const save = useContentMutation({
    mutationFn: (v: TagValues) => {
      const body = { name: v.name, slug: v.slug || null };
      return item
        ? unwrap(adminApi.PUT("/api/v1/admin/tags/{id}", { params: { path: { id: item.id } }, body }))
        : unwrap(adminApi.POST("/api/v1/admin/tags", { body }));
    },
    queryKey: tagsKey,
    tags: ["posts"],
    successMessage: item ? "Etiket kaydedildi." : "Etiket oluşturuldu.",
  });

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.stopPropagation();
        void handleSubmit(async (v) => {
          await save.mutateAsync(v);
          onDone();
        })(e);
      }}
    >
      <DialogHeader>
        <DialogTitle>{item ? "Etiketi düzenle" : "Yeni etiket"}</DialogTitle>
        <DialogDescription>Etiketler küçük harfle ve kısa tutulduğunda en iyi sonucu verir.</DialogDescription>
      </DialogHeader>
      <Field label="Ad" htmlFor="tag-name" error={errors.name?.message}>
        <input id="tag-name" autoFocus className={inputClass} aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <Field label="Adres (slug)" htmlFor="tag-slug" error={errors.slug?.message} hint="Boş bırakılırsa addan üretilir.">
        <input id="tag-slug" className={inputClass} aria-invalid={!!errors.slug} {...register("slug")} />
      </Field>
      <DialogFooter>
        <button type="button" onClick={onDone} className={actionVariants({ variant: "outline", size: "sm" })}>
          Vazgeç
        </button>
        <button type="submit" disabled={formState.isSubmitting} className={actionVariants({ variant: "dark", size: "sm" })}>
          {formState.isSubmitting && <LoaderCircle aria-hidden className="animate-spin" />}
          {item ? "Kaydet" : "Oluştur"}
        </button>
      </DialogFooter>
    </form>
  );
}
