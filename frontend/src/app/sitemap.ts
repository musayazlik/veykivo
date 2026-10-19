import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/api/content";
import { siteUrl } from "@/lib/site";

const staticPaths = [
  "/",
  "/kurumsal/hakkimizda",
  "/kurumsal/ekibimiz",
  "/hizmetler",
  "/projeler",
  "/teknolojiler",
  "/blog",
  "/iletisim",
  "/kvkk",
  "/gizlilik-politikasi",
];

const prefix = { service: "/hizmetler", project: "/projeler", post: "/blog", category: "/blog/kategori" } as Record<string, string>;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemapEntries();
  return [
    ...staticPaths.map((path) => ({ url: `${siteUrl}${path}`, changeFrequency: "monthly" as const, priority: path === "/" ? 1 : 0.7 })),
    ...entries
      .filter((e) => prefix[e.type])
      .map((e) => ({ url: `${siteUrl}${prefix[e.type]}/${e.slug}`, lastModified: e.updatedAt, priority: 0.6 })),
  ];
}
