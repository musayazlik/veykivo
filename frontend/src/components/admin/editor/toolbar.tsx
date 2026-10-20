"use client";

import { type ReactNode } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Code,
  FileCode2,
  ImagePlus,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Maximize2,
  Minimize2,
  Minus,
  Redo2,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
  Table,
  TextQuote,
  Undo2,
} from "lucide-react";

const BLOCKS = [
  { value: "paragraph", label: "Paragraf" },
  { value: "h2", label: "Başlık 2" },
  { value: "h3", label: "Başlık 3" },
  { value: "h4", label: "Başlık 4" },
] as const;

/** Araç çubuğu düğmeleri belgeden odak almaz; seçim yerinde kalır. */
function Tool({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      className={active ? "is-active" : undefined}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const Separator = () => <span className="wtiptap-sep" aria-hidden="true" />;

type ToolbarProps = {
  editor: Editor;
  /** Kaynak (Markdown) modunda yalnızca mod düğmeleri etkin kalır. */
  source: boolean;
  fullscreen: boolean;
  uploading: boolean;
  onLink: () => void;
  onImage: () => void;
  onToggleSource: () => void;
  onToggleFullscreen: () => void;
};

export function Toolbar({ editor, source, fullscreen, uploading, onLink, onImage, onToggleSource, onToggleFullscreen }: ToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive("heading", { level: 2 }) ? "h2" : e.isActive("heading", { level: 3 }) ? "h3" : e.isActive("heading", { level: 4 }) ? "h4" : "paragraph",
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      taskList: e.isActive("taskList"),
      canIndent: e.can().sinkListItem("listItem") || e.can().sinkListItem("taskItem"),
      canOutdent: e.can().liftListItem("listItem") || e.can().liftListItem("taskItem"),
      blockquote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      link: e.isActive("link"),
      table: e.isActive("table"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();
  const off = source;

  return (
    <div className="wtiptap-toolbar" role="toolbar" aria-label="Biçimlendirme">
      <Tool label="Geri al" disabled={off || !state.canUndo} onClick={() => chain().undo().run()}>
        <Undo2 />
      </Tool>
      <Tool label="Yinele" disabled={off || !state.canRedo} onClick={() => chain().redo().run()}>
        <Redo2 />
      </Tool>
      <Separator />

      <label className="sr-only" htmlFor={`${editor.instanceId}-block`}>
        Metin stili
      </label>
      <select
        id={`${editor.instanceId}-block`}
        className="wtiptap-select"
        value={state.block}
        disabled={off}
        onChange={(event) => {
          const value = event.target.value;
          if (value === "paragraph") chain().setParagraph().run();
          else chain().setHeading({ level: Number(value.slice(1)) as 2 | 3 | 4 }).run();
        }}
      >
        {BLOCKS.map((block) => (
          <option key={block.value} value={block.value}>
            {block.label}
          </option>
        ))}
      </select>
      <Separator />

      <Tool label="Kalın (Ctrl+B)" active={state.bold} disabled={off} onClick={() => chain().toggleBold().run()}>
        <Bold />
      </Tool>
      <Tool label="İtalik (Ctrl+I)" active={state.italic} disabled={off} onClick={() => chain().toggleItalic().run()}>
        <Italic />
      </Tool>
      <Tool label="Üstü çizili" active={state.strike} disabled={off} onClick={() => chain().toggleStrike().run()}>
        <Strikethrough />
      </Tool>
      <Tool label="Satır içi kod" active={state.code} disabled={off} onClick={() => chain().toggleCode().run()}>
        <Code />
      </Tool>
      <Separator />

      <Tool label="Madde listesi" active={state.bulletList} disabled={off} onClick={() => chain().toggleBulletList().run()}>
        <List />
      </Tool>
      <Tool label="Numaralı liste" active={state.orderedList} disabled={off} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered />
      </Tool>
      <Tool label="Görev listesi" active={state.taskList} disabled={off} onClick={() => chain().toggleTaskList().run()}>
        <ListTodo />
      </Tool>
      <Tool
        label="Girintiyi artır (Tab)"
        disabled={off || !state.canIndent}
        onClick={() => (editor.can().sinkListItem("taskItem") ? chain().sinkListItem("taskItem") : chain().sinkListItem("listItem")).run()}
      >
        <IndentIncrease />
      </Tool>
      <Tool
        label="Girintiyi azalt (Shift+Tab)"
        disabled={off || !state.canOutdent}
        onClick={() => (editor.can().liftListItem("taskItem") ? chain().liftListItem("taskItem") : chain().liftListItem("listItem")).run()}
      >
        <IndentDecrease />
      </Tool>
      <Separator />

      <Tool label="Alıntı" active={state.blockquote} disabled={off} onClick={() => chain().toggleBlockquote().run()}>
        <TextQuote />
      </Tool>
      <Tool label="Kod bloğu" active={state.codeBlock} disabled={off} onClick={() => chain().toggleCodeBlock().run()}>
        <SquareCode />
      </Tool>
      <Tool label="Ayırıcı" disabled={off} onClick={() => chain().setHorizontalRule().run()}>
        <Minus />
      </Tool>
      <Separator />

      <Tool label="Bağlantı (Ctrl+K)" active={state.link} disabled={off} onClick={onLink}>
        <Link2 />
      </Tool>
      <Tool label="Görsel: kütüphaneden seç veya yükle" disabled={off || uploading} onClick={onImage}>
        <ImagePlus />
      </Tool>
      <Tool
        label="Tablo ekle"
        active={state.table}
        disabled={off || state.table}
        onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <Table />
      </Tool>
      <Separator />

      <Tool label="Biçimlendirmeyi temizle" disabled={off} onClick={() => chain().unsetAllMarks().clearNodes().run()}>
        <RemoveFormatting />
      </Tool>
      <span className="wtiptap-toolbar-end">
        <Tool label={source ? "Editöre dön" : "Markdown kaynağını düzenle"} active={source} onClick={onToggleSource}>
          <FileCode2 />
        </Tool>
        <Tool label={fullscreen ? "Tam ekrandan çık (Esc)" : "Tam ekran"} active={fullscreen} onClick={onToggleFullscreen}>
          {fullscreen ? <Minimize2 /> : <Maximize2 />}
        </Tool>
      </span>
    </div>
  );
}

/** İmleç tablonun içindeyken görünen satır ve sütun işlemleri. */
export function TableBar({ editor }: { editor: Editor }) {
  const can = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      inTable: e.isActive("table"),
      merge: e.can().mergeCells(),
      split: e.can().splitCell(),
    }),
  });
  if (!can.inTable) return null;
  const chain = () => editor.chain().focus();
  const action = (label: string, run: () => void, disabled = false, danger = false) => (
    <button
      type="button"
      className={danger ? "wtiptap-chip is-danger" : "wtiptap-chip"}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={run}
    >
      {label}
    </button>
  );

  return (
    <div className="wtiptap-context" role="toolbar" aria-label="Tablo">
      <span className="wtiptap-context-label">Tablo</span>
      {action("+ Üst satır", () => chain().addRowBefore().run())}
      {action("+ Alt satır", () => chain().addRowAfter().run())}
      {action("+ Sol sütun", () => chain().addColumnBefore().run())}
      {action("+ Sağ sütun", () => chain().addColumnAfter().run())}
      {action("Başlık satırı", () => chain().toggleHeaderRow().run())}
      {action("Hücreleri birleştir", () => chain().mergeCells().run(), !can.merge)}
      {action("Hücreyi böl", () => chain().splitCell().run(), !can.split)}
      {action("Satırı sil", () => chain().deleteRow().run(), false, true)}
      {action("Sütunu sil", () => chain().deleteColumn().run(), false, true)}
      {action("Tabloyu sil", () => chain().deleteTable().run(), false, true)}
    </div>
  );
}

/** Seçili görselin alternatif metni; Markdown çıktısında aynen saklanır. */
export function ImageBar({ editor }: { editor: Editor }) {
  const image = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e.isActive("image") ? { alt: (e.getAttributes("image").alt as string | null) ?? "" } : null,
  });
  if (!image) return null;

  return (
    <div className="wtiptap-context" role="toolbar" aria-label="Görsel">
      <span className="wtiptap-context-label">Görsel</span>
      <label className="wtiptap-alt">
        <span>Alternatif metin</span>
        <input
          type="text"
          value={image.alt}
          placeholder="Görseli ekran okuyucular için tanımlayın"
          onChange={(event) => editor.chain().updateAttributes("image", { alt: event.target.value }).run()}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
        />
      </label>
      <button
        type="button"
        className="wtiptap-chip is-danger"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().deleteSelection().run()}
      >
        Kaldır
      </button>
    </div>
  );
}
