"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api/browser";
import { revalidateContent } from "@/app/admin/actions";

type Tag = Parameters<typeof revalidateContent>[0][number];

/**
 * Panel kayıt/silme işlemleri için ortak akış: API çağrısı → bildirim → liste önbelleğini ve
 * public sitenin ilgili önbellek etiketini tazele → (isteğe bağlı) listeye dön.
 */
export function useContentMutation<TVars, TResult>({
  mutationFn,
  queryKey,
  tags,
  successMessage,
  redirectTo,
}: {
  mutationFn: (vars: TVars) => Promise<TResult>;
  queryKey: unknown[];
  tags: Tag[];
  successMessage: string;
  redirectTo?: string;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      toast.success(successMessage);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        revalidateContent(tags).catch(() => undefined),
      ]);
      if (redirectTo) router.push(redirectTo);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}
