"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor, JSONContent } from "@tiptap/react";
import { errorMessage, uploadMedia } from "@/lib/api/browser";
import type { MediaAsset } from "@/lib/api/types";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function altFromName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
}

/** Kütüphane kayıtlarını editör görsel düğümlerine çevirir. */
export function toImageNodes(assets: MediaAsset[]): JSONContent[] {
  return assets.map((asset) => ({ type: "image", attrs: { src: asset.url, alt: asset.altText } }));
}

/**
 * Editöre yapıştırılan veya bırakılan görselleri medya kütüphanesine yükler
 * (imlecin ya da bırakma noktasının olduğu yere ekler). Panelin geri kalanıyla
 * aynı yükleme yolunu kullanır: /api/v1/admin/media, en fazla 5 MB.
 */
export function useMediaUpload(editor: Editor | null) {
  const editorRef = useRef(editor);
  const insertAt = useRef<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const upload = async (files: File[], at?: number) => {
    if (files.length === 0 || busy) return;
    insertAt.current = at ?? editorRef.current?.state.selection.to ?? null;
    setBusy(true);
    setError("");
    const uploaded: MediaAsset[] = [];
    const failed: string[] = [];

    for (const [index, file] of files.entries()) {
      if (!ACCEPTED.includes(file.type)) {
        failed.push(`${file.name}: yalnızca JPG, PNG, WEBP veya AVIF yüklenebilir`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        failed.push(`${file.name}: dosya en fazla 5 MB olabilir`);
        continue;
      }
      setStatus(`Yükleniyor (${index + 1}/${files.length}): ${file.name}`);
      try {
        uploaded.push(await uploadMedia(file, altFromName(file.name)));
      } catch (err) {
        failed.push(`${file.name}: ${errorMessage(err)}`);
      }
    }

    setBusy(false);
    setStatus("");
    if (uploaded.length > 0) {
      const instance = editorRef.current;
      const at2 = insertAt.current;
      insertAt.current = null;
      if (instance) {
        const chain = instance.chain().focus();
        const nodes = toImageNodes(uploaded);
        (at2 === null ? chain.insertContent(nodes) : chain.insertContentAt(Math.min(at2, instance.state.doc.content.size), nodes)).run();
      }
    }
    if (failed.length > 0) setError(failed.join(" · "));
  };

  return { upload, busy, status, error, clearError: () => setError("") };
}
