"use server";

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { contentTags } from "@/lib/api/content";

type ContentTag = (typeof contentTags)[keyof typeof contentTags];

/**
 * Panelde yapılan değişikliklerden sonra public sitenin önbelleğini tazeler.
 * Herkese açık bir Server Action olduğu için çağıranın oturumu API'de doğrulanır.
 */
export async function revalidateContent(tags: ContentTag[]) {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${process.env.API_INTERNAL_URL ?? "http://localhost:5080"}/api/v1/auth/me`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return { ok: false };

  const allowed = new Set<string>(Object.values(contentTags));
  for (const tag of tags) if (allowed.has(tag)) updateTag(tag);
  return { ok: true };
}
