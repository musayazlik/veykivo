"use client";

import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";
import type { Problem } from "./types";

/**
 * Yönetim paneli istemcisi. İstekler Next.js rewrite'ı üzerinden aynı origin'e gider;
 * kimlik HttpOnly cookie'de taşınır, durum değiştiren isteklere CSRF token'ı eklenir.
 */
let csrfToken: string | null = null;

export async function refreshCsrfToken() {
  const res = await fetch("/api/v1/auth/csrf", { credentials: "same-origin", cache: "no-store" });
  csrfToken = res.ok ? ((await res.json()) as { token: string }).token : null;
  return csrfToken;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const csrfMiddleware: Middleware = {
  async onRequest({ request }) {
    if (SAFE_METHODS.has(request.method)) return request;
    const token = csrfToken ?? (await refreshCsrfToken());
    if (token) request.headers.set("X-CSRF-TOKEN", token);
    return request;
  },
};

export const adminApi = createClient<paths>({ baseUrl: "", credentials: "same-origin" });
adminApi.use(csrfMiddleware);

export class ApiError extends Error {
  constructor(
    public status: number,
    public problem: Problem,
  ) {
    super(problem.detail ?? problem.title ?? `İstek başarısız (${status})`);
  }
}

/** openapi-fetch sonucunu açar: hata varsa ApiError fırlatır, 401'de giriş sayfasına yönlendirir. */
export async function unwrap<T>(promise: Promise<{ data?: T; error?: unknown; response: Response }>): Promise<T> {
  const { data, error, response } = await promise;
  if (response.status === 401 && typeof window !== "undefined" && !location.pathname.startsWith("/admin/giris")) {
    // Router'a erişimi olmayan yardımcı fonksiyon; oturum düştüğünde tam sayfa yönlendirme bilinçli tercih.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    location.href = `/admin/giris?donus=${encodeURIComponent(location.pathname)}`;
  }
  if (!response.ok) {
    // Token süresi dolmuş olabilir; bir sonraki istek için yenile.
    if (response.status === 400) csrfToken = null;
    throw new ApiError(response.status, (error as Problem) ?? {});
  }
  return data as T;
}

export function errorMessage(err: unknown) {
  if (err instanceof ApiError) {
    if (err.problem.errors) return Object.values(err.problem.errors).flat()[0] ?? err.message;
    return err.message;
  }
  return "Beklenmeyen bir hata oluştu.";
}

/** Görsel yükleme multipart olduğu için doğrudan fetch ile yapılır. */
export async function uploadMedia(file: File, altText: string) {
  const token = csrfToken ?? (await refreshCsrfToken());
  const body = new FormData();
  body.append("file", file);
  body.append("altText", altText);
  const res = await fetch("/api/v1/admin/media", {
    method: "POST",
    body,
    credentials: "same-origin",
    headers: token ? { "X-CSRF-TOKEN": token } : undefined,
  });
  if (!res.ok) {
    const problem = (await res.json().catch(() => ({}))) as Problem;
    if (res.status === 413) problem.detail = "Dosya en fazla 5 MB olabilir.";
    throw new ApiError(res.status, problem);
  }
  return (await res.json()) as import("./types").MediaAsset;
}
