"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  ChevronsUpDown,
  Globe,
  ImageIcon,
  Languages,
  LoaderCircle,
  Minimize2,
  PenLine,
  Search,
  Sparkles,
  Wand2,
  Maximize2,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi, errorMessage, unwrap } from "@/lib/api/browser";
import type { AiGenerateResult, AiModel, AiRewriteResult } from "@/lib/api/types";
import { SelectField } from "../controls";
import { Toggle, inputClass } from "../form";
import { actionVariants } from "@/components/site/action-link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const aiModelsKey = ["admin", "ai", "models"];

export function useAiModels(enabled = true) {
  return useQuery({
    queryKey: aiModelsKey,
    queryFn: () => unwrap(adminApi.GET("/api/v1/admin/ai/models")),
    staleTime: 10 * 60_000,
    enabled,
  });
}

export const styleOptions = [
  { value: "informative", label: "Bilgilendirici" },
  { value: "conversational", label: "Samimi" },
  { value: "persuasive", label: "İkna edici" },
  { value: "technical", label: "Teknik" },
];
export const depthOptions = [
  { value: "concise", label: "Kısa", hint: "~450 kelime" },
  { value: "standard", label: "Standart", hint: "~850 kelime" },
  { value: "in-depth", label: "Kapsamlı", hint: "~1400 kelime" },
];
export const languageOptions = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "İngilizce" },
  { value: "de", label: "Almanca" },
];

function price(m: AiModel) {
  if (m.isFree) return "Ücretsiz";
  if (m.promptPricePerMillion == null) return "";
  return `$${m.promptPricePerMillion} / $${m.completionPricePerMillion} · 1M`;
}

// ------------------------------------------------------------------ Model seçici

/** OpenRouter kataloğundan aranabilir model seçimi; boş değer "otomatik" (panel ayarı veya yedek model) demektir. */
export function ModelPicker({
  id,
  value,
  onChange,
  models,
  autoLabel = "Otomatik (panel ayarı)",
}: {
  id?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  models: AiModel[];
  autoLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return models.filter((m) => !term || m.id.toLowerCase().includes(term) || m.name.toLowerCase().includes(term)).slice(0, 80);
  }, [models, q]);
  const current = models.find((m) => m.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-white px-3 text-left text-[0.95rem] outline-none hover:border-ink/40 focus-visible:border-teal focus-visible:ring-3 focus-visible:ring-teal/20 data-popup-open:border-teal"
      >
        <span className="min-w-0 truncate">{current ? current.name : value ?? <span className="text-muted-foreground">{autoLabel}</span>}</span>
        <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--anchor-width) min-w-80 gap-0 p-0">
        <div className="flex items-center gap-2 border-b border-line px-3">
          <Search aria-hidden className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Model ara (ör. gpt, gemini, claude)"
            className="h-10 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <ul role="listbox" className="max-h-72 overflow-y-auto p-1.5">
          <li>
            <ModelRow selected={value === null} onClick={() => (onChange(null), setOpen(false))} title={autoLabel} meta="" />
          </li>
          {filtered.map((m) => (
            <li key={m.id}>
              <ModelRow selected={m.id === value} onClick={() => (onChange(m.id), setOpen(false))} title={m.name} sub={m.id} meta={price(m)} free={m.isFree} />
            </li>
          ))}
          {filtered.length === 0 && <li className="px-3 py-3 text-sm text-muted-foreground">Model bulunamadı.</li>}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function ModelRow({ selected, onClick, title, sub, meta, free }: { selected: boolean; onClick: () => void; title: string; sub?: string; meta: string; free?: boolean }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-mist focus-visible:bg-mist focus-visible:outline-none"
    >
      <Check aria-hidden className={cn("size-4 shrink-0", selected ? "text-teal" : "invisible")} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink">{title}</span>
        {sub && <span className="block truncate text-xs text-muted-foreground">{sub}</span>}
      </span>
      {meta && (
        <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[0.7rem] tabular-nums", free ? "bg-teal/10 text-teal" : "text-muted-foreground")}>{meta}</span>
      )}
    </button>
  );
}

// ------------------------------------------------------------------ Yazı üretme

type Fields = { title: boolean; excerpt: boolean; content: boolean; seo: boolean; category: boolean; tags: boolean; cover: boolean };
const fieldLabels: { key: keyof Fields; label: string }[] = [
  { key: "title", label: "Başlık" },
  { key: "excerpt", label: "Özet" },
  { key: "content", label: "İçerik" },
  { key: "seo", label: "SEO başlığı ve açıklaması" },
  { key: "category", label: "Kategori önerisi" },
  { key: "tags", label: "Etiket önerileri" },
  { key: "cover", label: "Kapak görseli" },
];

export function AiGenerateDialog({
  open,
  onOpenChange,
  initialTopic,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTopic: string;
  onApply: (result: AiGenerateResult) => Promise<void>;
}) {
  const models = useAiModels(open);
  const defaults = models.data?.defaults;
  const [topic, setTopic] = useState("");
  const [fields, setFields] = useState<Fields>({ title: true, excerpt: true, content: true, seo: true, category: true, tags: true, cover: false });
  const [style, setStyle] = useState<string | null>(null);
  const [depth, setDepth] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [webSearch, setWebSearch] = useState<boolean | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [imageModel, setImageModel] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "running" | "done">("form");
  const [result, setResult] = useState<AiGenerateResult | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const abort = useRef<AbortController | null>(null);

  // Pencere her açıldığında konu başlıktan doldurulur.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setTopic(initialTopic);
      setPhase("form");
      setResult(null);
    }
  }

  useEffect(() => {
    if (phase !== "running") return;
    const started = Date.now();
    const t = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const configured = models.data?.configured ?? true;
  const anyField = Object.values(fields).some(Boolean);

  const run = async () => {
    abort.current = new AbortController();
    setElapsed(0);
    setPhase("running");
    try {
      const r = await unwrap(
        adminApi.POST("/api/v1/admin/ai/generate-post", {
          body: {
            topic,
            fields,
            style: style ?? defaults?.style ?? null,
            depth: depth ?? defaults?.depth ?? null,
            language: language ?? defaults?.language ?? null,
            webSearch: webSearch ?? defaults?.webSearch ?? false,
            model,
            imageModel,
          },
          signal: abort.current.signal,
        }),
      );
      setResult(r);
      setPhase("done");
    } catch (err) {
      if ((err as Error).name === "AbortError") toast.info("Üretim iptal edildi.");
      else toast.error(errorMessage(err));
      setPhase("form");
    }
  };

  const apply = async () => {
    if (!result) return;
    await onApply(result);
    toast.success("AI önerisi forma uygulandı. Kontrol edip kaydedin.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => phase !== "running" && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles aria-hidden className="size-5 text-signal-strong" /> AI ile yazı oluştur
          </DialogTitle>
          <DialogDescription>OpenRouter üzerinden çalışır. Sonuç forma doldurulur; kaydetmeden önce kontrol edebilirsiniz.</DialogDescription>
        </DialogHeader>

        {!configured && (
          <p role="alert" className="flex gap-2 rounded-md border border-signal/60 bg-signal/10 px-3 py-2.5 text-sm text-ink">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              Yapay zekâ servisi yapılandırılmamış. Sunucuda <code className="font-mono">OpenRouter__ApiKey</code> ortam değişkenini tanımlayın.
            </span>
          </p>
        )}

        {phase === "form" && (
          <div className="space-y-5">
            <div>
              <label htmlFor="ai-topic" className="mb-1.5 block text-sm font-medium text-ink">
                Konu veya kısa brif
              </label>
              <textarea
                id="ai-topic"
                rows={4}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="ör. KOBİ'ler için ERP seçerken dikkat edilmesi gerekenler; üretim firmaları hedef kitle, pratik kontrol listesi olsun."
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted-foreground">Hedef kitleyi, vurgulamak istediğiniz noktaları ve tonu yazmak sonucu iyileştirir.</p>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink">Üretilecek alanlar</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {fieldLabels.map(({ key, label }) => (
                  <label
                    key={key}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-teal/30",
                      fields[key] ? "border-ink bg-ink/[0.04] text-ink" : "border-line text-ink/75 hover:border-input",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-(--teal)"
                      checked={fields[key]}
                      onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.checked }))}
                    />
                    {key === "cover" && <ImageIcon aria-hidden className="size-3.5 text-muted-foreground" />}
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink">Stil</span>
                <SelectField value={style ?? defaults?.style ?? "informative"} onChange={setStyle} options={styleOptions} />
              </div>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink">Uzunluk</span>
                <SelectField value={depth ?? defaults?.depth ?? "standard"} onChange={setDepth} options={depthOptions} />
              </div>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink">Dil</span>
                <SelectField value={language ?? defaults?.language ?? "tr"} onChange={setLanguage} options={languageOptions} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink">Metin modeli</span>
                <ModelPicker value={model} onChange={setModel} models={models.data?.text ?? []} />
              </div>
              <div className={cn(!fields.cover && "opacity-50")}>
                <span className="mb-1.5 block text-sm font-medium text-ink">Görsel modeli</span>
                <ModelPicker value={imageModel} onChange={setImageModel} models={models.data?.image ?? []} />
              </div>
            </div>

            <div className="rounded-md border border-line bg-paper/60 p-3">
              <Toggle
                label="Önce web'de araştır"
                description="Güncel kaynaklarla yazar ve metne kaynak bağlantıları ile kaynakça ekler. Daha uzun sürer ve daha maliyetlidir."
                checked={webSearch ?? defaults?.webSearch ?? false}
                onChange={(e) => setWebSearch(e.target.checked)}
              />
            </div>
          </div>
        )}

        {phase === "running" && (
          <div role="status" className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="relative flex size-14 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-signal/30 motion-reduce:hidden" />
              <span className="relative flex size-14 items-center justify-center rounded-full bg-ink text-signal">
                <Sparkles className="size-6" />
              </span>
            </span>
            <div>
              <p className="font-semibold text-ink">{webSearch ?? defaults?.webSearch ? "Araştırılıyor ve yazılıyor…" : "Yazılıyor…"}</p>
              <p className="mt-1 text-sm text-muted-foreground tabular-nums">{elapsed} sn geçti. Kapsamlı yazılar bir-iki dakika sürebilir.</p>
            </div>
          </div>
        )}

        {phase === "done" && result && <AiResultPreview result={result} />}

        <DialogFooter>
          {phase === "form" && (
            <>
              <button type="button" onClick={() => onOpenChange(false)} className={actionVariants({ variant: "outline", size: "sm" })}>
                Vazgeç
              </button>
              <button type="button" disabled={!configured || topic.trim().length < 3 || !anyField} onClick={run} className={actionVariants({ size: "sm" })}>
                <Sparkles aria-hidden /> Oluştur
              </button>
            </>
          )}
          {phase === "running" && (
            <button type="button" onClick={() => abort.current?.abort()} className={actionVariants({ variant: "outline", size: "sm" })}>
              İptal et
            </button>
          )}
          {phase === "done" && (
            <>
              <button type="button" onClick={() => setPhase("form")} className={actionVariants({ variant: "outline", size: "sm" })}>
                Ayarlara dön
              </button>
              <button type="button" onClick={run} className={actionVariants({ variant: "outline", size: "sm" })}>
                Yeniden oluştur
              </button>
              <button type="button" onClick={apply} className={actionVariants({ variant: "dark", size: "sm" })}>
                <Check aria-hidden /> Forma uygula
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AiResultPreview({ result }: { result: AiGenerateResult }) {
  const words = result.content ? result.content.split(/\s+/).filter(Boolean).length : 0;
  return (
    <div className="space-y-4">
      {result.warnings.length > 0 && (
        <ul className="space-y-1 rounded-md border border-signal/60 bg-signal/10 px-3 py-2.5 text-sm text-ink">
          {result.warnings.map((w) => (
            <li key={w} className="flex gap-2">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" /> {w}
            </li>
          ))}
        </ul>
      )}
      <dl className="divide-y divide-line rounded-lg border border-line">
        {result.title && <PreviewRow label="Başlık" value={result.title} />}
        {result.excerpt && <PreviewRow label="Özet" value={result.excerpt} />}
        {result.content && <PreviewRow label="İçerik" value={`${words} kelime, ${(result.content.match(/^## /gm) ?? []).length} alt başlık`} />}
        {result.seoTitle && <PreviewRow label="SEO başlığı" value={result.seoTitle} />}
        {result.category && <PreviewRow label="Kategori" value={result.category} />}
        {result.tags.length > 0 && <PreviewRow label="Etiketler" value={result.tags.join(", ")} />}
        {result.sources.length > 0 && <PreviewRow label="Kaynaklar" value={`${result.sources.length} kaynak, kaynakça eklendi`} />}
      </dl>
      {result.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={result.cover.url} alt={result.cover.altText} className="aspect-video w-full rounded-lg border border-line object-cover" />
      )}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Globe aria-hidden className="size-3.5" /> Model: {result.model}
      </p>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 px-3.5 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

// ------------------------------------------------------------------ Yeniden yazma

const presets = [
  { label: "Daha sade ve anlaşılır yaz", icon: PenLine, instruction: "Metni daha sade, kısa cümlelerle ve anlaşılır biçimde yeniden yaz; anlamı ve yapıyı koru." },
  { label: "Kısalt", icon: Minimize2, instruction: "Metni yaklaşık %30 kısalt; önemli bilgileri ve alt başlık yapısını koru." },
  { label: "Genişlet", icon: Maximize2, instruction: "Her bölümü somut örnekler ve pratik ipuçlarıyla genişlet; uydurma istatistik ekleme." },
  { label: "Daha teknik yap", icon: GraduationCap, instruction: "Metni BT yöneticileri ve geliştiriciler için daha teknik ve terminolojiye uygun hâle getir." },
  { label: "Yazım ve dil bilgisini düzelt", icon: Wand2, instruction: "Yalnızca yazım, noktalama ve dil bilgisi hatalarını düzelt; üslubu değiştirme." },
  { label: "İngilizceye çevir", icon: Languages, instruction: "Translate the text into natural, professional English.", language: "en" },
];

/** İçerik alanı için hızlı AI düzenlemeleri; uygulanan değişiklik bildirimden geri alınabilir. */
export function AiRewriteMenu({
  getContent,
  onApply,
}: {
  getContent: () => { title: string; excerpt: string; content: string };
  onApply: (result: Partial<AiRewriteResult>) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState("");

  const run = async (label: string, instruction: string, language?: string) => {
    const before = getContent();
    if (!before.content.trim()) return toast.error("Önce içerik alanına metin yazın.");
    setBusy(label);
    try {
      const r = await unwrap(adminApi.POST("/api/v1/admin/ai/rewrite", { body: { instruction, content: before.content, title: null, excerpt: null, language: language ?? null, model: null } }));
      onApply({ content: r.content });
      toast.success(`"${label}" uygulandı.`, { action: { label: "Geri al", onClick: () => onApply({ content: before.content }) }, duration: 10_000 });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={busy !== null}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-white px-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/40 disabled:opacity-60 data-popup-open:border-teal"
        >
          {busy ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <Sparkles aria-hidden className="size-4 text-signal-strong" />}
          {busy ? `${busy}…` : "AI ile düzenle"}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {presets.map((p) => (
            <DropdownMenuItem key={p.label} onClick={() => run(p.label, p.instruction, p.language)}>
              <p.icon aria-hidden />
              {p.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="my-1 bg-line" />
          <DropdownMenuItem onClick={() => setCustomOpen(true)}>
            <PenLine aria-hidden />
            Özel talimat yaz…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Özel AI talimatı</DialogTitle>
            <DialogDescription>İçeriğe uygulanacak değişikliği yazın. Sonuç beğenmezseniz bildirimden geri alabilirsiniz.</DialogDescription>
          </DialogHeader>
          <textarea
            rows={4}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="ör. Giriş paragrafını üretim firmalarına hitap edecek şekilde yeniden yaz ve sona bir kontrol listesi ekle."
            className={inputClass}
          />
          <DialogFooter>
            <button type="button" onClick={() => setCustomOpen(false)} className={actionVariants({ variant: "outline", size: "sm" })}>
              Vazgeç
            </button>
            <button
              type="button"
              disabled={custom.trim().length < 3}
              onClick={() => {
                setCustomOpen(false);
                void run("Özel talimat", custom.trim());
              }}
              className={actionVariants({ variant: "dark", size: "sm" })}
            >
              <Sparkles aria-hidden /> Uygula
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
