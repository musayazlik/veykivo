"use client";

import { useId, useMemo, useRef, useState } from "react";
import { format, isValid, parse } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarDays, Check, ChevronsUpDown, Plus, Search, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export type Option<V extends string = string> = { value: V; label: string; color?: string; hint?: string };

/** Panel genelinde tüm tetikleyici kontrollerin (select, çoklu seçim, tarih) ortak görünümü. */
export const triggerClass =
  "flex min-h-10 w-full items-center gap-2 rounded-md border border-input bg-white px-3 py-1.5 text-left text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow] hover:border-ink/40 focus-visible:border-teal focus-visible:ring-3 focus-visible:ring-teal/20 aria-invalid:border-destructive data-popup-open:border-teal data-popup-open:ring-3 data-popup-open:ring-teal/20 disabled:opacity-60";

function Swatch({ color }: { color?: string }) {
  return color ? <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: color }} /> : null;
}

// ------------------------------------------------------------------ Tekli seçim

export function SelectField<V extends string>({
  id,
  value,
  onChange,
  options,
  placeholder = "Seçin",
  clearLabel,
  invalid,
  className,
}: {
  id?: string;
  value: V | null | undefined;
  onChange: (value: V | null) => void;
  options: Option<V>[];
  placeholder?: string;
  /** Verilirse listenin başına "seçimi kaldır" öğesi eklenir. */
  clearLabel?: string;
  invalid?: boolean;
  className?: string;
}) {
  return (
    <Select value={value ?? null} onValueChange={(v) => onChange((v as V | null) ?? null)}>
      <SelectTrigger id={id} aria-invalid={invalid || undefined} className={cn(triggerClass, "h-10 justify-between data-[size=default]:h-10", className)}>
        <SelectValue>
          {(v: V | null) => {
            const o = options.find((x) => x.value === v);
            return o ? (
              <span className="flex min-w-0 items-center gap-2">
                <Swatch color={o.color} />
                <span className="truncate">{o.label}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            );
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-(--anchor-width)">
        {clearLabel && (
          <SelectItem value={null} className="text-muted-foreground">
            {clearLabel}
          </SelectItem>
        )}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <span className="flex min-w-0 items-center gap-2">
              <Swatch color={o.color} />
              <span className="min-w-0">
                <span className="block truncate">{o.label}</span>
                {o.hint && <span className="block truncate text-xs text-muted-foreground">{o.hint}</span>}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ------------------------------------------------------------------ Çoklu seçim

export function MultiSelect<V extends string>({
  id,
  value,
  onChange,
  options,
  placeholder = "Seçin",
  searchPlaceholder = "Ara…",
  emptyText = "Sonuç yok.",
  onCreate,
  createLabel = (q: string) => `“${q}” oluştur`,
  max,
  invalid,
}: {
  id?: string;
  value: V[];
  onChange: (value: V[]) => void;
  options: Option<V>[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Verilirse aramada eşleşme yoksa yeni öğe oluşturulabilir; oluşturulan değerin seçilmesi çağırana bırakılır. */
  onCreate?: (label: string) => Promise<void> | void;
  createLabel?: (query: string) => string;
  max?: number;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const listId = useId();
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => value.map((v) => options.find((o) => o.value === v)).filter(Boolean) as Option<V>[], [value, options]);
  const q = query.trim().toLocaleLowerCase("tr");
  const filtered = options.filter((o) => o.label.toLocaleLowerCase("tr").includes(q));
  const exact = options.some((o) => o.label.toLocaleLowerCase("tr") === q);
  const atMax = max !== undefined && value.length >= max;

  const toggle = (v: V) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else if (!atMax) onChange([...value, v]);
  };

  const create = async () => {
    if (!onCreate || !q || exact || creating) return;
    setCreating(true);
    try {
      await onCreate(query.trim());
      setQuery("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        aria-invalid={invalid || undefined}
        className={cn(triggerClass, "flex-wrap")}
        onClick={() => setTimeout(() => searchRef.current?.focus(), 0)}
      >
        {selected.length === 0 ? (
          <span className="flex-1 text-muted-foreground">{placeholder}</span>
        ) : (
          <span className="flex flex-1 flex-wrap gap-1.5">
            {selected.map((o) => (
              <span key={o.value} className="inline-flex items-center gap-1 rounded-full bg-mist py-0.5 pr-1 pl-2.5 text-sm text-ink">
                <Swatch color={o.color} />
                {o.label}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`${o.label} kaldır`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(o.value);
                  }}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-ink/10 hover:text-ink"
                >
                  <X className="size-3" />
                </span>
              </span>
            ))}
          </span>
        )}
        <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--anchor-width) min-w-64 gap-0 p-0">
        <div className="flex items-center gap-2 border-b border-line px-3">
          <Search aria-hidden className="size-4 text-muted-foreground" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (filtered.length === 1) toggle(filtered[0].value);
                else void create();
              }
            }}
            placeholder={searchPlaceholder}
            aria-controls={listId}
            className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ul id={listId} role="listbox" aria-multiselectable className="max-h-64 overflow-y-auto p-1.5">
          {filtered.map((o) => {
            const isSelected = value.includes(o.value);
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={!isSelected && atMax}
                  onClick={() => toggle(o.value)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-mist focus-visible:bg-mist focus-visible:outline-none disabled:opacity-50"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border",
                      isSelected ? "border-ink bg-ink text-on-ink" : "border-input bg-white",
                    )}
                  >
                    {isSelected && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <Swatch color={o.color} />
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="text-xs text-muted-foreground tabular-nums">{o.hint}</span>}
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && !onCreate && <li className="px-2.5 py-3 text-sm text-muted-foreground">{emptyText}</li>}
          {onCreate && q && !exact && (
            <li>
              <button
                type="button"
                onClick={() => void create()}
                disabled={creating}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-teal hover:bg-mist disabled:opacity-60"
              >
                <Plus aria-hidden className="size-4" />
                {createLabel(query.trim())}
              </button>
            </li>
          )}
        </ul>
        {max !== undefined && (
          <p className="border-t border-line px-3 py-2 text-xs text-muted-foreground">
            {value.length} / {max} seçildi
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ------------------------------------------------------------------ Tarih / tarih-saat

const LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm";

/**
 * Değer yerel saat biçiminde tutulur ("2026-10-21T09:30"); API'ye gönderirken new Date(value).toISOString() kullanılır.
 * withTime=false iken saat 00:00 kabul edilir.
 */
export function DateTimePicker({
  id,
  value,
  onChange,
  withTime = true,
  placeholder = "Tarih seçin",
  disablePast,
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  withTime?: boolean;
  placeholder?: string;
  disablePast?: boolean;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const parsed = value ? parse(value, LOCAL_FORMAT, new Date()) : null;
  const date = parsed && isValid(parsed) ? parsed : null;
  const time = date ? format(date, "HH:mm") : "09:00";

  const commit = (day: Date | undefined, hhmm = time) => {
    if (!day) return onChange("");
    const [h, m] = hhmm.split(":").map(Number);
    const next = new Date(day);
    next.setHours(withTime ? h || 0 : 0, withTime ? m || 0 : 0, 0, 0);
    onChange(format(next, LOCAL_FORMAT));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger id={id} aria-invalid={invalid || undefined} className={cn(triggerClass, "h-10 pr-9")}>
          <CalendarDays aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          {date ? (
            <span className="truncate">{format(date, withTime ? "d MMMM yyyy, HH:mm" : "d MMMM yyyy", { locale: tr })}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </PopoverTrigger>
        {date && (
          <button
            type="button"
            aria-label="Tarihi temizle"
            onClick={() => onChange("")}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-mist hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent align="start" className="w-auto gap-0 p-0">
        <Calendar
          mode="single"
          locale={tr}
          selected={date ?? undefined}
          defaultMonth={date ?? undefined}
          onSelect={(d) => {
            commit(d);
            if (!withTime) setOpen(false);
          }}
          disabled={disablePast ? { before: today } : undefined}
          className="p-3 [--cell-size:--spacing(9)]"
        />
        {withTime && (
          <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2.5">
            <label htmlFor={`${id}-time`} className="text-sm text-muted-foreground">
              Saat
            </label>
            <input
              id={`${id}-time`}
              type="time"
              value={time}
              disabled={!date}
              onChange={(e) => commit(date ?? undefined, e.target.value)}
              className="rounded-md border border-input bg-white px-2 py-1 text-sm tabular-nums outline-none focus:border-teal disabled:opacity-50"
            />
            <button type="button" onClick={() => setOpen(false)} className="rounded-md bg-ink px-3 py-1 text-sm font-medium text-on-ink">
              Tamam
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ------------------------------------------------------------------ Renk

export const colorPresets = ["#2F6F6A", "#0E2A2F", "#B7791F", "#C2410C", "#B42318", "#5B4FCF", "#2563EB", "#0F766E", "#4D7C0F", "#6B7280"];

export function ColorField({ id, value, onChange }: { id?: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2.5">
      <div role="radiogroup" aria-label="Hazır renkler" className="flex flex-wrap gap-2">
        {colorPresets.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={value.toUpperCase() === c}
            aria-label={c}
            onClick={() => onChange(c)}
            className={cn(
              "size-7 rounded-full ring-offset-2 transition-shadow",
              value.toUpperCase() === c ? "ring-2 ring-ink" : "hover:ring-2 hover:ring-line",
            )}
            style={{ background: c }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label="Özel renk"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#2F6F6A"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-9 w-11 cursor-pointer rounded-md border border-input bg-white p-1"
        />
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          className="h-9 w-28 rounded-md border border-input bg-white px-2.5 font-mono text-sm uppercase outline-none focus:border-teal"
        />
      </div>
    </div>
  );
}
