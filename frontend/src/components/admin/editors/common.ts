import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .max(160)
  .regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Yalnızca küçük harf, rakam ve tire kullanın (ör. ozel-yazilim).");

export const seoSchema = {
  seoTitle: z.string().max(70, "En fazla 70 karakter."),
  seoDescription: z.string().max(170, "En fazla 170 karakter."),
};

/** Formdaki boş metinleri API'ye null olarak gönderir. */
export const orNull = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

export const sortOrderSchema = z.number({ error: "Bir sayı girin." }).int().min(0).max(9999);
