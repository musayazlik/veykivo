import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

/*
 * İçerik veritabanında Markdown olarak tutulur (AI üretimi de Markdown'dır ve
 * sitede react-markdown ile basılır). Tiptap ise HTML üzerine çalıştığı için
 * iki format arasında bu dosya üzerinden gidip geliriz: editör açılırken
 * Markdown → HTML, her değişiklikte HTML → Markdown.
 */

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  hr: "---",
});
turndown.use(gfm);

/**
 * Markdown → editör HTML'i. Başlıklar araç çubuğunun sunduğu aralığa
 * (h2–h4) sıkıştırılır; h1 yazı başlığına ayrıldığı için gövdede kullanılmaz.
 */
export function markdownToHtml(text: string) {
  const html = marked.parse(text, { async: false }) as string;
  return html.replace(/<h([1-6])>/g, (_, level: string) => `<h${Math.min(4, Math.max(2, Number(level)))}>`);
}

/** Editör HTML'i → saklanan Markdown (GFM: tablolar, görev listeleri, üstü çizili). */
export function htmlToMarkdown(html: string) {
  return (
    turndown
      .turndown(html)
      // Turndown'un işaretçilerden sonra açtığı fazladan boşluklar sıkıştırılır.
      .replace(/^(\s*)[-*+] {3,}/gm, "$1- ")
      .replace(/^(\s*\d{1,9}\.) {2,}/gm, "$1 ")
      .replace(/(\[[ xX]\]) {2,}/gm, "$1 ")
      .trim()
  );
}

/*
 * Markdown yapıştırma desteği: düz metin panoları bariz biçimde Markdown
 * taşıyorsa şema düğümlerine çevrilir. Puanlama bilinçli olarak ihtiyatlı —
 * tek bir **kelime** veya tek bağlantı düz metin kalır, bütün belgeler çevrilir.
 */
const MD_SIGNALS: { pattern: RegExp; score: number }[] = [
  { pattern: /(^|\n) {0,3}(?:```|~~~)/, score: 3 }, // fenced kod bloğu
  { pattern: /(^|\n) {0,3}#{1,6} \S/, score: 3 }, // başlık
  { pattern: /(^|\n) {0,3}> \S/, score: 2 }, // alıntı
  { pattern: /\*\*[^*\n]+\*\*|__[^_\n]+__/, score: 2 }, // kalın
  { pattern: /\[[^\]\n]+\]\([^)\n]{4,}\)/, score: 2 }, // bağlantı
];

export function looksLikeMarkdown(text: string) {
  if (text.trim().length < 6) return false;
  let score = 0;
  for (const { pattern, score: value } of MD_SIGNALS) {
    if (pattern.test(text)) score += value;
  }
  if ((text.match(/(^|\n) {0,3}[-*+] \S/g) ?? []).length >= 2) score += 3; // madde listesi
  if ((text.match(/(^|\n) {0,3}\d{1,9}[.)] \S/g) ?? []).length >= 2) score += 3; // numaralı liste
  return score >= 3;
}
