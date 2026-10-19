import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { ServiceListItem } from "@/lib/api/types";
import { ServiceIcon } from "./service-icon";

/**
 * Hizmetler kart ızgarası yerine okunabilir bir dizin olarak listelenir.
 * Masaüstünde satırın üzerine gelince hizmet görseli sağda belirir (yalnızca kullanıcı eylemiyle hareket).
 */
export function ServicesIndex({ services }: { services: ServiceListItem[] }) {
  if (services.length === 0) {
    return <p className="border-t border-line py-10 text-muted-foreground">Hizmetler yakında burada listelenecek.</p>;
  }

  return (
    <ul className="border-t border-line">
      {services.map((s) => (
        <li key={s.slug} className="group relative border-b border-line">
          <Link
            href={`/hizmetler/${s.slug}`}
            className="grid grid-cols-[auto_1fr_auto] items-start gap-x-5 gap-y-2 py-7 transition-colors duration-300 md:grid-cols-[3rem_minmax(0,22rem)_minmax(0,1fr)_auto] md:items-center md:gap-x-8 md:py-8"
          >
            <span className="flex size-11 items-center justify-center rounded-md bg-mist text-teal transition-colors duration-300 group-hover:bg-ink group-hover:text-signal">
              <ServiceIcon name={s.icon} className="size-5" />
            </span>
            <h3 className="text-[1.4rem] leading-tight font-bold tracking-[-0.015em] text-ink md:text-[1.6rem]">{s.title}</h3>
            <p className="col-span-3 col-start-1 text-muted-foreground md:col-span-1 md:col-start-3 md:max-w-md">
              {s.summary}
            </p>
            <ArrowUpRight
              aria-hidden
              className="col-start-3 row-start-1 size-6 text-ink/40 transition-[color,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink md:col-start-4"
            />
          </Link>
          {s.coverImage && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-16 hidden aspect-[4/3] w-48 -translate-y-1/2 rotate-2 overflow-hidden opacity-0 shadow-[0_20px_40px_-18px_rgb(14_42_47/0.5)] transition-[opacity,transform] duration-500 ease-(--ease-out-quart) group-hover:rotate-0 group-hover:opacity-100 lg:block"
            >
              <Image src={s.coverImage.url} alt="" fill sizes="192px" className="object-cover" />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
