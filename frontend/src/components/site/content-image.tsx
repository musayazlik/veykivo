import Image, { type ImageProps } from "next/image";
import type { Media } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * API'den gelen görselleri gösterir. Görsel yoksa blueprint desenli yer tutucu çizer,
 * böylece içerik eklenmeden de yerleşim bozulmaz.
 */
export function ContentImage({
  media,
  className,
  sizes,
  priority,
  fallbackLabel,
}: {
  media: Media | null | undefined;
  className?: string;
  sizes: string;
  priority?: boolean;
  fallbackLabel?: string;
} & Pick<ImageProps, "sizes" | "priority">) {
  if (!media?.url) {
    return (
      <div
        role="img"
        aria-label={fallbackLabel ?? "Görsel eklenmedi"}
        className={cn("blueprint relative flex items-center justify-center bg-[#e3e7ef]", className)}
      >
        <span className="text-sm text-[#878da0]">{fallbackLabel ?? "Görsel"}</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-[#e3e7ef]", className)}>
      <Image
        src={media.url}
        alt={media.altText}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
