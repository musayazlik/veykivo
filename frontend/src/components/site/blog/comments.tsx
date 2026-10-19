"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleCheck, CornerDownRight, LoaderCircle, MessageSquare, ShieldCheck, X } from "lucide-react";
import type { Problem, PublicComment } from "@/lib/api/types";
import { actionVariants } from "../action-link";
import { formatDate } from "@/lib/site";
import { cn } from "@/lib/utils";

const schema = z.object({
  authorName: z.string().trim().min(2, "Adınız en az 2 karakter olmalı.").max(60),
  authorEmail: z.union([z.literal(""), z.email("Geçerli bir e-posta adresi yazın.")]),
  body: z.string().trim().min(2, "Yorumunuzu yazın.").max(2000, "Yorum en fazla 2000 karakter olabilir."),
  website: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export function CommentsSection({ postSlug, comments, count }: { postSlug: string; comments: PublicComment[]; count: number }) {
  const [replyTo, setReplyTo] = useState<PublicComment | null>(null);

  return (
    <section id="yorumlar" aria-labelledby="yorumlar-baslik" className="mt-16 max-w-3xl scroll-mt-28">
      <h2 id="yorumlar-baslik" className="flex items-center gap-2.5 text-h3 text-ink">
        <MessageSquare aria-hidden className="size-5 text-teal" />
        {count > 0 ? `${count} yorum` : "Yorumlar"}
      </h2>

      {comments.length === 0 ? (
        <p className="mt-4 text-muted-foreground">Henüz yorum yok. İlk yorumu siz yazın.</p>
      ) : (
        <ol className="mt-6 space-y-6">
          {comments.map((c) => (
            <li key={c.id}>
              <CommentItem comment={c} onReply={() => setReplyTo(c)} />
              {c.replies.length > 0 && (
                <ol className="mt-4 space-y-4 border-l-2 border-line pl-5 sm:ml-5">
                  {c.replies.map((r) => (
                    <li key={r.id}>
                      <CommentItem comment={r} />
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      )}

      <CommentForm postSlug={postSlug} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
    </section>
  );
}

function CommentItem({ comment, onReply }: { comment: PublicComment; onReply?: () => void }) {
  return (
    <article className={cn("rounded-lg border p-5", comment.isStaffReply ? "border-ink/15 bg-ink/[0.03]" : "border-line bg-white")}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          aria-hidden
          className={cn(
            "flex size-8 items-center justify-center rounded-full text-sm font-bold",
            comment.isStaffReply ? "bg-ink text-signal" : "bg-mist text-ink/70",
          )}
        >
          {comment.authorName.charAt(0).toLocaleUpperCase("tr")}
        </span>
        <span className="font-semibold text-ink">{comment.authorName}</span>
        {comment.isStaffReply && (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-xs font-medium text-on-ink">
            <ShieldCheck aria-hidden className="size-3" /> Veykivo ekibi
          </span>
        )}
        <time dateTime={comment.createdAt} className="text-sm text-muted-foreground">
          {formatDate(comment.createdAt)}
        </time>
      </header>
      <p className="mt-3 whitespace-pre-line text-ink/85">{comment.body}</p>
      {onReply && (
        <button type="button" onClick={onReply} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline">
          <CornerDownRight aria-hidden className="size-4" /> Yanıtla
        </button>
      )}
    </article>
  );
}

function CommentForm({ postSlug, replyTo, onCancelReply }: { postSlug: string; replyTo: PublicComment | null; onCancelReply: () => void }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, setError: setFieldError, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { authorName: "", authorEmail: "", body: "" },
  });
  const errors = formState.errors;

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      const res = await fetch(`/api/v1/posts/${encodeURIComponent(postSlug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, authorEmail: v.authorEmail || null, parentId: replyTo?.id ?? null }),
      });
      if (res.ok) {
        reset();
        onCancelReply();
        setSent(true);
        return;
      }
      if (res.status === 429) return setError("Kısa sürede çok sayıda yorum gönderildi. Birkaç dakika sonra tekrar deneyin.");
      const problem = (await res.json().catch(() => ({}))) as Problem;
      if (problem.errors) {
        for (const [field, messages] of Object.entries(problem.errors)) setFieldError(field as keyof Values, { message: messages[0] });
        return;
      }
      setError(problem.detail ?? "Yorumunuz gönderilemedi. Lütfen tekrar deneyin.");
    } catch {
      setError("Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.");
    }
  });

  if (sent) {
    return (
      <div role="status" className="mt-10 flex gap-3 rounded-lg border border-teal/30 bg-teal/5 p-5">
        <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-teal" />
        <div>
          <p className="font-semibold text-ink">Yorumunuz alındı.</p>
          <p className="mt-1 text-sm text-muted-foreground">Ekibimiz kontrol ettikten sonra yayınlanacak.</p>
          <button type="button" onClick={() => setSent(false)} className="mt-2 text-sm font-semibold text-teal hover:underline">
            Yeni yorum yaz
          </button>
        </div>
      </div>
    );
  }

  const field =
    "block w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-base text-ink outline-none transition-[border-color,box-shadow] focus:border-teal focus:ring-3 focus:ring-teal/20 aria-invalid:border-destructive";

  return (
    <form onSubmit={onSubmit} noValidate className="relative mt-10 rounded-lg border border-line bg-white p-5 sm:p-7">
      <h3 className="text-[1.15rem] font-bold text-ink">{replyTo ? "Yanıt yazın" : "Yorum yazın"}</h3>
      {replyTo && (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <CornerDownRight aria-hidden className="size-4" />
          <span>
            <strong className="font-semibold text-ink">{replyTo.authorName}</strong> adlı kişiye yanıt veriyorsunuz.
          </span>
          <button type="button" onClick={onCancelReply} aria-label="Yanıtı iptal et" className="rounded p-1 hover:bg-mist">
            <X className="size-3.5" />
          </button>
        </p>
      )}
      <p className="mt-1 text-sm text-muted-foreground">Yorumlar onaylandıktan sonra yayınlanır. E-posta adresiniz paylaşılmaz.</p>

      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Web sitesi
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1.5 block text-[0.95rem] font-medium text-ink">
            Adınız <span className="text-destructive">*</span>
          </label>
          <input id="c-name" autoComplete="name" className={field} aria-invalid={!!errors.authorName} {...register("authorName")} />
          {errors.authorName && <p className="mt-1.5 text-sm text-destructive">{errors.authorName.message}</p>}
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1.5 block text-[0.95rem] font-medium text-ink">
            E-posta <span className="font-normal text-muted-foreground">(isteğe bağlı)</span>
          </label>
          <input id="c-email" type="email" autoComplete="email" className={field} aria-invalid={!!errors.authorEmail} {...register("authorEmail")} />
          {errors.authorEmail && <p className="mt-1.5 text-sm text-destructive">{errors.authorEmail.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-body" className="mb-1.5 block text-[0.95rem] font-medium text-ink">
            Yorumunuz <span className="text-destructive">*</span>
          </label>
          <textarea id="c-body" rows={5} className={field} aria-invalid={!!errors.body} {...register("body")} />
          {errors.body && <p className="mt-1.5 text-sm text-destructive">{errors.body.message}</p>}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <button type="submit" disabled={formState.isSubmitting} className={cn(actionVariants(), "mt-6")}>
        {formState.isSubmitting && <LoaderCircle aria-hidden className="animate-spin" />}
        {formState.isSubmitting ? "Gönderiliyor" : replyTo ? "Yanıtı gönder" : "Yorumu gönder"}
      </button>
    </form>
  );
}
