import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Typography } from "@tiptap/extension-typography";
import { CharacterCount, Placeholder } from "@tiptap/extensions";

/**
 * Editörün sunduğu her şey Markdown'a kaydedilebilir olmalı: içerik Markdown
 * olarak saklanıp sitede react-markdown ile basıldığı için renk, vurgu,
 * hizalama, alt/üst indis, video ve YouTube gibi Markdown'a çevrilemeyen
 * düğüm/biçimler kasıtlı olarak dışarıda bırakıldı.
 */
export function richTextExtensions(placeholder: string) {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      // GFM'de altı çizgi yoktur; turndown kaybedeceği için kapatılır.
      underline: false,
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      },
    }),
    Placeholder.configure({ placeholder }),
    CharacterCount,
    // Akıllı tırnak, tire ve ok; kesirler "13/14" biçiminde kopyaya dokunmasın.
    Typography.configure({ oneHalf: false, oneQuarter: false, threeQuarters: false }),
    TaskList,
    TaskItem.configure({ nested: true }),
    // GFM tabloları sütun genişliğini saklamadığı için boyutlandırma kapalı.
    TableKit.configure({ table: { resizable: false } }),
    Image.configure({ inline: false, allowBase64: false }),
  ];
}
