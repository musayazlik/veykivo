import "server-only";
import createClient from "openapi-fetch";
import { cacheLife, cacheTag } from "next/cache";
import type { paths } from "./schema";
import type { ServiceDetail, ProjectDetail, PostDetail } from "./types";

/**
 * Public içerik okuma katmanı (yalnızca sunucu).
 * Her fonksiyon `use cache` ile önbelleğe alınır ve içerik türüne göre etiketlenir;
 * yönetim panelindeki kayıt işlemleri bu etiketleri geçersiz kılar (bkz. app/admin/actions.ts).
 * API'ye ulaşılamazsa sayfa çökmez; boş liste döner ve kısa süre sonra yeniden denenir.
 */
const api = createClient<paths>({ baseUrl: process.env.API_INTERNAL_URL ?? "http://localhost:5080" });

export const contentTags = {
  services: "services",
  projects: "projects",
  team: "team",
  technologies: "technologies",
  posts: "posts",
  settings: "settings",
} as const;

async function attempt<T>(label: string, fn: () => Promise<{ data?: T; response: Response }>): Promise<T | null> {
  try {
    const { data, response } = await fn();
    if (response.status === 404) return null;
    if (!response.ok) {
      console.error(`[api] ${label} → ${response.status}`);
      return null;
    }
    return data ?? null;
  } catch (error) {
    console.error(`[api] ${label} başarısız:`, (error as Error).message);
    return null;
  }
}

export async function getServices() {
  "use cache";
  cacheLife("minutes");
  cacheTag(contentTags.services);
  return (await attempt("services", () => api.GET("/api/v1/services"))) ?? [];
}

export async function getService(slug: string): Promise<ServiceDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(contentTags.services);
  return attempt(`service:${slug}`, () => api.GET("/api/v1/services/{slug}", { params: { path: { slug } } }));
}

export async function getProjects(options: { featured?: boolean; limit?: number } = {}) {
  "use cache";
  cacheLife("minutes");
  cacheTag(contentTags.projects);
  return (
    (await attempt("projects", () =>
      api.GET("/api/v1/projects", { params: { query: { featured: options.featured, limit: options.limit } } }),
    )) ?? []
  );
}

export async function getProject(slug: string): Promise<ProjectDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(contentTags.projects);
  return attempt(`project:${slug}`, () => api.GET("/api/v1/projects/{slug}", { params: { path: { slug } } }));
}

export async function getTeam() {
  "use cache";
  cacheLife("minutes");
  cacheTag(contentTags.team);
  return (await attempt("team", () => api.GET("/api/v1/team"))) ?? [];
}

export async function getTechnologies() {
  "use cache";
  cacheLife("minutes");
  cacheTag(contentTags.technologies);
  return (await attempt("technologies", () => api.GET("/api/v1/technologies"))) ?? [];
}

export type PostQuery = { page?: number; pageSize?: number; category?: string; tag?: string; q?: string; featured?: boolean };

export async function getPosts({ page = 1, pageSize = 9, category, tag, q, featured }: PostQuery = {}) {
  "use cache";
  cacheLife("minutes");
  cacheTag(contentTags.posts);
  return (
    (await attempt("posts", () =>
      api.GET("/api/v1/posts", { params: { query: { page, pageSize, category, tag, q, featured } } }),
    )) ?? { items: [], page, pageSize, totalCount: 0, totalPages: 0 }
  );
}

export async function getBlogCategories() {
  "use cache";
  cacheLife("minutes");
  cacheTag(contentTags.posts);
  return (await attempt("blog-categories", () => api.GET("/api/v1/blog/categories"))) ?? [];
}

export async function getBlogTags() {
  "use cache";
  cacheLife("minutes");
  cacheTag(contentTags.posts);
  return (await attempt("blog-tags", () => api.GET("/api/v1/blog/tags"))) ?? [];
}

export async function getPost(slug: string): Promise<PostDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(contentTags.posts);
  return attempt(`post:${slug}`, () => api.GET("/api/v1/posts/{slug}", { params: { path: { slug } } }));
}

export type SiteSettings = {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  workingHours: string;
  social: { label: string; href: string }[];
  seoTitle: string;
  seoDescription: string;
};

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag(contentTags.settings);
  const s = (await attempt("settings", () => api.GET("/api/v1/site-settings/public"))) ?? {};
  const social = [
    { label: "LinkedIn", href: s["social.linkedin"] },
    { label: "GitHub", href: s["social.github"] },
    { label: "Instagram", href: s["social.instagram"] },
    { label: "X", href: s["social.x"] },
  ].filter((x): x is { label: string; href: string } => Boolean(x.href));

  return {
    companyName: s["company.name"] || "Veykivo",
    tagline: s["company.tagline"] || "İşletmenize özel yazılım sistemleri",
    email: s["contact.email"] || "",
    phone: s["contact.phone"] || "",
    address: s["contact.address"] || "",
    workingHours: s["contact.workingHours"] || "",
    social,
    seoTitle: s["seo.defaultTitle"] || "Veykivo — Kurumsal Yazılım Geliştirme",
    seoDescription:
      s["seo.defaultDescription"] ||
      "Veykivo; işletmelere özel yazılım, web ve mobil uygulama, ERP/CRM ve otomasyon çözümleri geliştirir.",
  };
}

export async function getSitemapEntries() {
  "use cache";
  cacheLife("minutes");
  cacheTag(contentTags.services, contentTags.projects, contentTags.posts);
  return (await attempt("sitemap", () => api.GET("/api/v1/sitemap"))) ?? [];
}

/** generateStaticParams için: API yoksa build'in kırılmaması adına yer tutucu döner. */
export async function slugParams(type: "service" | "project" | "post" | "category") {
  const entries = await getSitemapEntries();
  const slugs = entries.filter((e) => e.type === type).map((e) => ({ slug: e.slug }));
  return slugs.length > 0 ? slugs : [{ slug: "__placeholder__" }];
}
