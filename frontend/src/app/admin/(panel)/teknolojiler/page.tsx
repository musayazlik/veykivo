"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { adminApi, unwrap } from "@/lib/api/browser";
import { technologyCategoryLabels, type AdminTechnology, type TechnologyCategory } from "@/lib/api/types";
import { ErrorState, PageHeader, PublishBadge } from "@/components/admin/ui";
import { DataTable, columnHelperFor, type Facet } from "@/components/admin/data-table";
import { Field, Toggle, inputClass } from "@/components/admin/form";
import { SelectField } from "@/components/admin/controls";
import { useContentMutation } from "@/components/admin/use-save";
import { useDeleteConfirm } from "@/components/admin/use-delete-confirm";
import { sortOrderSchema } from "@/components/admin/editors/common";
import { actionVariants } from "@/components/site/action-link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const categories = Object.keys(technologyCategoryLabels) as TechnologyCategory[];
const categoryOptions = categories.map((c) => ({ value: c, label: technologyCategoryLabels[c] }));
const listKey = ["admin", "technologies"];

const schema = z.object({
  name: z.string().trim().min(1, "Ad zorunlu.").max(80),
  category: z.enum(categories as [TechnologyCategory, ...TechnologyCategory[]]),
  sortOrder: sortOrderSchema,
  isPublished: z.boolean(),
});
type Values = z.infer<typeof schema>;

const col = columnHelperFor<AdminTechnology>();
const columns = col.columns([
  col.accessor("name", { header: "Teknoloji", cell: (c) => <span className="font-medium text-ink">{c.getValue()}</span> }),
  col.accessor("category", { header: "Kategori", filterFn: "inArray", cell: (c) => technologyCategoryLabels[c.getValue()] }),
  col.accessor((t) => String(t.isPublished), {
    id: "status",
    header: "Durum",
    filterFn: "inArray",
    cell: ({ row }) => <PublishBadge published={row.original.isPublished} draftLabel="Gizli" />,
  }),
  col.accessor("sortOrder", { header: "Sıra", cell: (c) => <span className="tabular-nums">{c.getValue()}</span> }),
]);

const facets: Facet[] = [
  { columnId: "category", title: "Kategori", options: categoryOptions },
  { columnId: "status", title: "Durum", options: [{ value: "true", label: "Sitede" }, { value: "false", label: "Gizli" }] },
];

export default function TechnologiesAdminPage() {
  const [editing, setEditing] = useState<AdminTechnology | "new" | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: listKey,
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/technologies")),
  });

  const remove = useContentMutation({
    mutationFn: (t: AdminTechnology) => unwrap(adminApi.DELETE("/api/v1/admin/technologies/{id}", { params: { path: { id: t.id } } })),
    queryKey: listKey,
    tags: ["technologies", "projects"],
    successMessage: "Teknoloji silindi.",
  });
  const { request: askDelete, dialog: deleteDialog } = useDeleteConfirm<AdminTechnology>({
    name: (t) => t.name,
    onDelete: (t) => remove.mutateAsync(t),
    description: "Teknoloji projelerden de kaldırılır. Bu işlem geri alınamaz.",
  });

  const rowActions = useMemo(
    () => (t: AdminTechnology) => [
      { label: "Düzenle", icon: Pencil, onSelect: () => setEditing(t) },
      { label: "Sil", icon: Trash2, destructive: true, separatorBefore: true, onSelect: () => askDelete(t) },
    ],
    [askDelete],
  );

  return (
    <>
      <PageHeader title="Teknolojiler" description="Teknolojiler sayfasında ve projelerde kullanılan liste." />
      {isError ? (
        <ErrorState message="Teknolojiler yüklenemedi." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder="Teknoloji ara"
          searchText={(t) => t.name}
          facets={facets}
          rowActions={rowActions}
          initialPageSize={20}
          toolbar={
            <button type="button" onClick={() => setEditing("new")} className={actionVariants({ variant: "dark", size: "sm" })}>
              <Plus aria-hidden /> Yeni teknoloji
            </button>
          }
        />
      )}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          {editing !== null && (
            <TechnologyForm key={editing === "new" ? "new" : editing.id} item={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
          )}
        </DialogContent>
      </Dialog>
      {deleteDialog}
    </>
  );
}

function TechnologyForm({ item, onDone }: { item: AdminTechnology | null; onDone: () => void }) {
  const { register, handleSubmit, control, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? { name: item.name, category: item.category, sortOrder: item.sortOrder, isPublished: item.isPublished }
      : { name: "", category: "Frontend", sortOrder: 0, isPublished: true },
  });
  const errors = formState.errors;

  const save = useContentMutation({
    mutationFn: (v: Values) => {
      const body = { ...v, icon: null, version: item?.version ?? null };
      return item
        ? unwrap(adminApi.PUT("/api/v1/admin/technologies/{id}", { params: { path: { id: item.id } }, body }))
        : unwrap(adminApi.POST("/api/v1/admin/technologies", { body }));
    },
    queryKey: listKey,
    tags: ["technologies", "projects"],
    successMessage: item ? "Teknoloji kaydedildi." : "Teknoloji eklendi.",
  });

  return (
    <form onSubmit={handleSubmit(async (v) => { await save.mutateAsync(v); onDone(); })} noValidate className="space-y-5">
      <DialogHeader>
        <DialogTitle>{item ? "Teknolojiyi düzenle" : "Yeni teknoloji"}</DialogTitle>
        <DialogDescription>Kategoriye göre gruplanarak sitede listelenir.</DialogDescription>
      </DialogHeader>
      <Field label="Ad" htmlFor="tech-name" error={errors.name?.message}>
        <input id="tech-name" className={inputClass} aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <div className="grid grid-cols-[1fr_7rem] gap-4">
        <Field label="Kategori" htmlFor="tech-category">
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <SelectField id="tech-category" value={field.value} onChange={(v) => v && field.onChange(v)} options={categoryOptions} />
            )}
          />
        </Field>
        <Field label="Sıra" htmlFor="tech-order" error={errors.sortOrder?.message}>
          <input id="tech-order" type="number" className={inputClass} {...register("sortOrder", { valueAsNumber: true })} />
        </Field>
      </div>
      <Toggle label="Sitede göster" {...register("isPublished")} />
      <DialogFooter>
        <button type="button" onClick={onDone} className={actionVariants({ variant: "outline", size: "sm" })}>
          Vazgeç
        </button>
        <button type="submit" disabled={formState.isSubmitting} className={actionVariants({ variant: "dark", size: "sm" })}>
          {formState.isSubmitting && <LoaderCircle aria-hidden className="animate-spin" />}
          Kaydet
        </button>
      </DialogFooter>
    </form>
  );
}
