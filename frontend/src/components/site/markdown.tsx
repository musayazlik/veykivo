import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** Blog ve hizmet gövdeleri için basit Markdown. Ham HTML render edilmez (XSS'e karşı varsayılan güvenli). */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose-vk", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const external = href?.startsWith("http");
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {children}
              </a>
            );
          },
          h1: ({ children }) => <h2>{children}</h2>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
