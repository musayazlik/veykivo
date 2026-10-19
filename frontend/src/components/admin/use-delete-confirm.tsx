"use client";

import { useCallback, useState } from "react";
import { ConfirmDialog } from "./ui";

/**
 * Tablo satırından silme akışı: aksiyon menüsünden request(row) çağrılır, onay penceresi açılır.
 * Pencere bileşeni `dialog` olarak sayfaya yerleştirilir.
 */
export function useDeleteConfirm<T>({
  name,
  onDelete,
  description = "Bu işlem geri alınamaz.",
}: {
  name: (row: T) => string;
  onDelete: (row: T) => Promise<unknown>;
  description?: string;
}) {
  const [target, setTarget] = useState<T | null>(null);
  // Kararlı referans: tablo aksiyon kolonu her render'da yeniden oluşmasın.
  const request = useCallback((row: T) => setTarget(() => row), []);
  return {
    request,
    dialog: (
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title={target ? `"${name(target)}" silinsin mi?` : ""}
        description={description}
        onConfirm={() => onDelete(target as T)}
      />
    ),
  };
}
