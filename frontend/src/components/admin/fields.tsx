"use client";

import { useState } from "react";
import type { UseFormRegister, FieldErrors, FieldValues, Path, UseFormWatch } from "react-hook-form";
import { Markdown } from "@/components/site/markdown";
import { Field, inputClass } from "./form";
import { cn } from "@/lib/utils";

/** Karakter sayacı olan metin alanı; SEO alanlarında önerilen uzunluğu gösterir. */
export function CountedInput<T extends FieldValues>({
  name,
  label,
  max,
  hint,
  register,
  watch,
  errors,
  multiline,
}: {
  name: Path<T>;
  label: string;
  max: number;
  hint?: string;
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  errors: FieldErrors<T>;
  multiline?: boolean;
}) {
  const value = (watch(name) as string | null | undefined) ?? "";
  const error = errors[name]?.message as string | undefined;
  return (
    <Field label={label} htmlFor={name} error={error} hint={hint}>
      {multiline ? (
        <textarea id={name} rows={3} className={inputClass} aria-invalid={!!error} {...register(name)} />
      ) : (
        <input id={name} className={inputClass} aria-invalid={!!error} {...register(name)} />
      )}
      <p className={cn("mt-1 text-right text-xs tabular-nums", value.length > max ? "text-destructive" : "text-muted-foreground")}>
        {value.length} / {max}
      </p>
    </Field>
  );
}

export function SeoFields<T extends FieldValues>(props: {
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  errors: FieldErrors<T>;
}) {
  return (
    <>
      <CountedInput<T> {...props} name={"seoTitle" as Path<T>} label="SEO başlığı" max={70} hint="Boş bırakılırsa içerik başlığı kullanılır." />
      <CountedInput<T>
        {...props}
        name={"seoDescription" as Path<T>}
        label="SEO açıklaması"
        max={170}
        hint="Arama sonuçlarında görünen kısa açıklama. Boş bırakılırsa özet kullanılır."
        multiline
      />
    </>
  );
}

/** Markdown düzenleyici: yazma ve önizleme sekmeleri. */
export function MarkdownEditor({
  id,
  value,
  error,
  textareaProps,
  rows = 18,
}: {
  id: string;
  value: string;
  error?: string;
  textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  rows?: number;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  return (
    <div>
      <div role="tablist" aria-label="Düzenleyici görünümü" className="mb-2 flex gap-1">
        {(["write", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              tab === t ? "bg-ink text-on-ink" : "text-muted-foreground hover:bg-mist",
            )}
          >
            {t === "write" ? "Yaz" : "Önizle"}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-muted-foreground">
          Markdown: ## başlık, **kalın**, - liste, [bağlantı](https://...)
        </span>
      </div>
      <textarea
        id={id}
        rows={rows}
        className={cn(inputClass, "font-mono text-sm leading-relaxed", tab !== "write" && "hidden")}
        aria-invalid={!!error}
        {...textareaProps}
      />
      {tab === "preview" && (
        <div className="min-h-64 rounded-md border border-line bg-paper/50 p-5">
          {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-muted-foreground">Önizlenecek içerik yok.</p>}
        </div>
      )}
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function NumberField({ id, label, hint, ...props }: { id: string; label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <input id={id} type="number" inputMode="numeric" className={cn(inputClass, "w-32")} {...props} />
    </Field>
  );
}
