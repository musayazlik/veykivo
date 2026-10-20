"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { Upload } from "lucide-react";
import { htmlToMarkdown, looksLikeMarkdown, markdownToHtml } from "./markdown";
import { richTextExtensions } from "./extensions";
import { ImageBar, TableBar, Toolbar } from "./toolbar";
import { toImageNodes, useMediaUpload } from "./use-media-upload";
import { MediaInsertDialog } from "./media-insert-dialog";

type Props = {
  id: string;
  /** Saklanan içerik; Markdown olarak girer ve Markdown olarak çıkar. */
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  /** Düzenleme alanının erişilebilir adı. */
  label?: string;
};

type Prompt = { value: string };

/** Durum çubuğu için kelime ve karakter sayacı. */
function useCounts(editor: Editor | null) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e ? { words: e.storage.characterCount.words(), characters: e.storage.characterCount.characters() } : { words: 0, characters: 0 },
  }) ?? { words: 0, characters: 0 };
}

/**
 * cmsmotive panosundaki Tiptap 3 zengin metin editörünün Veykivo'ya
 * uyarlanmışı: başlıklar, vurgular, listeler ve görev listeleri, tablolar,
 * bağlantılar ve medya kütüphanesinden görseller; Markdown kaynağı görünümü,
 * tam ekran, yapıştırma/bırakma ile görsel yükleme.
 */
export default function RichTextEditor({ id, value, onChange, placeholder = "Yazmaya başlayın…", label = "İçerik" }: Props) {
  const onChangeRef = useRef(onChange);
  // Editörün kendi işleyicileri bir kez oluşturulduğu için instance'a ve yükleyiciye ref'ler üzerinden ulaşır.
  const editorRef = useRef<Editor | null>(null);
  const uploadRef = useRef<(files: File[], at?: number) => Promise<void>>(async () => {});
  /** Editörün son dışarı bildirdiği Markdown; dış değişiklikleri geri bildirimden ayırt eder. */
  const lastEmitted = useRef(value);
  const [source, setSource] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [dragging, setDragging] = useState(false);
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Yalnızca ilk açılışta çevrilir; sonraki dış değişiklikler senkron etkisiyle uygulanır.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialHtml = useMemo(() => markdownToHtml(value), []);

  const editor = useEditor({
    extensions: richTextExtensions(placeholder),
    content: initialHtml,
    // Next.js sunucuda da render eder; kurulumu ertelemek hydration uyuşmazlığını önler.
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "wtiptap-content", id, "aria-label": label, "aria-multiline": "true" },
      handlePaste: (_view, event) => {
        const clipboard = event.clipboardData;
        if (!clipboard) return false;
        const files = Array.from(clipboard.files);
        if (files.length > 0) {
          void uploadRef.current(files);
          return true;
        }
        // Renderlanmış panolar (web, Office) varsayılan yapışmada kalır; yalnızca düz metin Markdown çevrilir.
        if (clipboard.types.includes("text/html")) return false;
        const text = clipboard.getData("text/plain");
        if (!looksLikeMarkdown(text) || !editorRef.current) return false;
        editorRef.current.chain().focus().insertContent(markdownToHtml(text)).run();
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (moved || files.length === 0) return false;
        event.preventDefault();
        void uploadRef.current(files, view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos);
        return true;
      },
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          openPrompt();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: instance }) => {
      const markdown = htmlToMarkdown(instance.getHTML());
      lastEmitted.current = markdown;
      onChangeRef.current(markdown);
    },
  });

  const media = useMediaUpload(editor);
  const counts = useCounts(editor);

  // Ref güncellemeleri render sırasında değil, etkilerle yapılır.
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);
  useEffect(() => {
    uploadRef.current = media.upload;
  }, [media.upload]);

  // Değer editörün dışından değiştiyse (AI önerisi, geri alma vb.) belgeyi eşitle.
  useEffect(() => {
    if (editor && source === null && value !== lastEmitted.current) {
      editor.commands.setContent(markdownToHtml(value), { emitUpdate: false });
      lastEmitted.current = value;
    }
  }, [editor, value, source]);

  // Tam ekran: Esc ile çıkılır; arka plandaki sayfa kaydırmaz.
  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: globalThis.KeyboardEvent) => {
      // Açık bir diyaloğun (görsel ekleme) içindeki Esc yalnızca diyaloğu kapatır.
      if (event.key === "Escape" && !document.querySelector("[data-state='open'][role='dialog']")) setFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);

  function openPrompt() {
    const instance = editorRef.current;
    if (!instance) return;
    setPrompt({ value: (instance.getAttributes("link").href as string | undefined) ?? "" });
  }

  function closePrompt() {
    setPrompt(null);
    editor?.commands.focus();
  }

  function applyPrompt() {
    if (!editor || !prompt) return;
    const url = prompt.value.trim();
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else if (editor.state.selection.empty && !editor.isActive("link")) {
      editor.chain().focus().insertContent({ type: "text", text: url, marks: [{ type: "link", attrs: { href: url } }] }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    closePrompt();
  }

  function onPromptKey(event: KeyboardEvent<HTMLInputElement>) {
    // Enter, çevredeki formu göndermemeli.
    if (event.key === "Enter") {
      event.preventDefault();
      applyPrompt();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closePrompt();
    }
  }

  function toggleSource() {
    if (!editor) return;
    if (source === null) {
      setPrompt(null);
      setSource(htmlToMarkdown(editor.getHTML()));
      return;
    }
    editor.commands.setContent(markdownToHtml(source), { emitUpdate: false });
    lastEmitted.current = source;
    onChangeRef.current(source);
    setSource(null);
  }

  const dropHandlers = {
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      if (source === null && event.dataTransfer.types.includes("Files")) setDragging(true);
    },
    onDragLeave: (event: DragEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as globalThis.Node | null)) setDragging(false);
    },
    onDrop: () => setDragging(false),
  };

  if (!editor) return <div className="wtiptap wtiptap-rich is-loading" aria-busy="true" />;

  return (
    <div className={fullscreen ? "wtiptap wtiptap-rich is-fullscreen" : "wtiptap wtiptap-rich"}>
      <Toolbar
        editor={editor}
        source={source !== null}
        fullscreen={fullscreen}
        uploading={media.busy}
        onLink={openPrompt}
        onImage={() => setPicker(true)}
        onToggleSource={toggleSource}
        onToggleFullscreen={() => setFullscreen((current) => !current)}
      />

      {prompt ? (
        <div className="wtiptap-prompt" role="group" aria-label="Bağlantı">
          <label htmlFor={`${id}-prompt`}>Bağlantı adresi</label>
          <input
            autoFocus
            id={`${id}-prompt`}
            type="url"
            inputMode="url"
            value={prompt.value}
            placeholder="https://ornek.com"
            onChange={(event) => setPrompt({ value: event.target.value })}
            onKeyDown={onPromptKey}
          />
          <button type="button" className="wtiptap-chip is-primary" onClick={applyPrompt}>
            Uygula
          </button>
          {editor.isActive("link") ? (
            <button
              type="button"
              className="wtiptap-chip is-danger"
              onClick={() => {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                closePrompt();
              }}
            >
              Bağlantıyı kaldır
            </button>
          ) : null}
          <button type="button" className="wtiptap-chip" onClick={closePrompt}>
            Vazgeç
          </button>
        </div>
      ) : null}

      {source === null ? (
        <>
          <TableBar editor={editor} />
          <ImageBar editor={editor} />
        </>
      ) : null}

      {media.error ? (
        <p className="wtiptap-error" role="alert">
          {media.error}{" "}
          <button type="button" className="wtiptap-dismiss" onClick={media.clearError}>
            Kapat
          </button>
        </p>
      ) : null}

      <div className="wtiptap-body" {...dropHandlers}>
        {source === null ? (
          <EditorContent editor={editor} />
        ) : (
          <textarea
            className="wtiptap-source"
            aria-label={`${label} Markdown kaynağı`}
            spellCheck={false}
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              lastEmitted.current = event.target.value;
              onChangeRef.current(event.target.value);
            }}
          />
        )}
        {dragging ? (
          <div className="wtiptap-drop" aria-hidden="true">
            <Upload className="size-6" />
            Görselleri bırakın; yüklendiğinde buraya eklenir
          </div>
        ) : null}
      </div>

      <div className="wtiptap-status">
        <span>
          {counts.words} kelime · {counts.characters} karakter
        </span>
        <span aria-live="polite">{media.busy ? media.status : source !== null ? "Markdown kaynağı düzenleniyor" : "Görselleri yapıştırıp bırakarak yükleyebilirsiniz"}</span>
      </div>

      <MediaInsertDialog
        open={picker}
        onOpenChange={setPicker}
        onSelect={(assets) => editor.chain().focus().insertContent(toImageNodes(assets)).run()}
      />
    </div>
  );
}
