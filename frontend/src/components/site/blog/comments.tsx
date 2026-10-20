"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleCheck, CornerDownRight, LoaderCircle, MessageSquare, ShieldCheck, X } from "lucide-react";
import type { Problem, PublicComment } from "@/lib/api/types";
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
    <section id="yorumlar" aria-labelledby="yorumlar-baslik" className="mt-20 max-w-3xl scroll-mt-28">
      <h2 id="yorumlar-baslik" className="flex items-center gap-2.5 text-[1.3rem] tracking-[-0.02em]">
        <MessageSquare aria-hidden className="size-5 text-[#6a7ba6]" />
        {count > 0 ? `${count} yorum` : "Yorumlar"}
      </h2>

      {comments.length === 0 ? (
        <p className="mt-4 text-[14px] text-[#646a7c]">Henüz yorum yok. İlk yorumu siz yazın.</p>
      ) : (
        <ol className="mt-7 space-y-5">
          {comments.map((c) => (
            <li key={c.id}>
              <CommentItem comment={c} onReply={() => setReplyTo(c)} />
              {c.replies.length > 0 && (
                <ol className="mt-4 space-y-4 border-l-2 border-[#e0e5f2] pl-5 sm:ml-6">
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
    <article className={cn("rounded-2xl border p-5", comment.isStaffReply ? "border-[#bec9ee] bg-[#f0f3fc]" : "border-[#e5e6ef] bg-white")}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          aria-hidden
          className={cn(
            "grid size-8 place-items-center rounded-full text-sm font-bold",
            comment.isStaffReply ? "bg-[#141722] text-[#a1b7ff]" : "bg-[#e9edf9] text-[#53638d]",
          )}
        >
          {comment.authorName.charAt(0).toLocaleUpperCase("tr")}
        </span>
        <span className="text-[15px] font-semibold text-[#171922]">{comment.authorName}</span>
        {comment.isStaffReply && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#141722] px-2.5 py-0.5 text-[11px] font-medium text-[#f5f6fb]">
            <ShieldCheck aria-hidden className="size-3" /> Veykivo ekibi
          </span>
        )}
        <time dateTime={comment.createdAt} className="text-[13px] text-[#878da0]">
          {formatDate(comment.createdAt)}
        </time>
      </header>
      <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-[#3c4150]">{comment.body}</p>
      {onReply && (
        <button type="button" onClick={onReply} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#3d56c9] hover:underline">
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
      <div role="status" className="mt-12 flex gap-3 rounded-2xl border border-[#bec9ee] bg-[#f0f3fc] p-5">
        <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-[#5a6fd8]" />
        <div>
          <p className="font-semibold text-[#171922]">Yorumunuz alındı.</p>
          <p className="mt-1 text-[14px] text-[#646a7c]">Ekibimiz kontrol ettikten sonra yayınlanacak.</p>
          <button type="button" onClick={() => setSent(false)} className="mt-2 text-[13px] font-semibold text-[#3d56c9] hover:underline">
            Yeni yorum yaz
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative mt-12 rounded-2xl border border-[#e5e6ef] bg-white p-5 sm:p-7">
      <h3 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[#171922]">{replyTo ? "Yanıt yazın" : "Yorum yazın"}</h3>
      {replyTo && (
        <p className="mt-2 flex items-center gap-2 text-[13px] text-[#646a7c]">
          <CornerDownRight aria-hidden className="size-4" />
          <span>
            <strong className="font-semibold text-[#171922]">{replyTo.authorName}</strong> adlı kişiye yanıt veriyorsunuz.
          </span>
          <button type="button" onClick={onCancelReply} aria-label="Yanıtı iptal et" className="rounded p-1 hover:bg-[#eef0f7]">
            <X className="size-3.5" />
          </button>
        </p>
      )}
      <p className="mt-1.5 text-[13px] text-[#878da0]">Yorumlar onaylandıktan sonra yayınlanır. E-posta adresiniz paylaşılmaz.</p>

      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Web sitesi
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1.5 block text-[14px] font-medium text-[#3c4150]">
            Adınız <span className="text-[#c25555]">*</span>
          </label>
          <input id="c-name" autoComplete="name" className="landing-input" aria-invalid={!!errors.authorName} {...register("authorName")} />
          {errors.authorName && <p className="mt-1.5 text-[13px] text-[#b44848]">{errors.authorName.message}</p>}
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1.5 block text-[14px] font-medium text-[#3c4150]">
            E-posta <span className="font-normal text-[#878da0]">(isteğe bağlı)</span>
          </label>
          <input id="c-email" type="email" autoComplete="email" className="landing-input" aria-invalid={!!errors.authorEmail} {...register("authorEmail")} />
          {errors.authorEmail && <p className="mt-1.5 text-[13px] text-[#b44848]">{errors.authorEmail.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-body" className="mb-1.5 block text-[14px] font-medium text-[#3c4150]">
            Yorumunuz <span className="text-[#c25555]">*</span>
          </label>
          <textarea id="c-body" rows={5} className="landing-input" aria-invalid={!!errors.body} {...register("body")} />
          {errors.body && <p className="mt-1.5 text-[13px] text-[#b44848]">{errors.body.message}</p>}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-[#e5b4b4] bg-[#fdf1f1] px-4 py-3 text-[14px] text-[#b44848]">
          {error}
        </p>
      )}

      <button type="submit" disabled={formState.isSubmitting} className="landing-btn-solid mt-6">
        {formState.isSubmitting && <LoaderCircle aria-hidden className="animate-spin" />}
        {formState.isSubmitting ? "Gönderiliyor" : replyTo ? "Yanıtı gönder" : "Yorumu gönder"}
      </button>
    </form>
  );
}
