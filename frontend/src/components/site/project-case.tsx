import Link from "next/link";
import type { ProjectListItem } from "@/lib/api/types";
import { ContentImage } from "./content-image";
import { RevealMask } from "./reveal";
import { cn } from "@/lib/utils";

/** Ana sayfa ve proje listesinde kullanılan geniş vaka çalışması satırı. */
export function ProjectCase({ project, flip = false, headingLevel = "h3" }: { project: ProjectListItem; flip?: boolean; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="group grid items-center gap-8 md:grid-cols-12 md:gap-12">
      <Link
        href={`/projeler/${project.slug}`}
        tabIndex={-1}
        aria-hidden
        className={cn("md:col-span-7", flip && "md:order-2 md:col-start-6")}
      >
        <RevealMask>
          <ContentImage
            media={project.coverImage}
            sizes="(min-width: 768px) 58vw, 100vw"
            className="notch aspect-[16/10]"
            fallbackLabel={project.title}
          />
        </RevealMask>
      </Link>
      <div className={cn("md:col-span-5", flip && "md:order-1 md:col-span-5 md:col-start-1")}>
        {(project.sector || project.clientName) && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {project.sector && (
              <span className="rounded-full border border-teal/30 px-2.5 py-0.5 font-medium text-teal">{project.sector}</span>
            )}
            {project.clientName && <span>{project.clientName}</span>}
          </p>
        )}
        <Heading className="mt-4 text-[1.75rem] leading-[1.15] font-bold tracking-[-0.02em] text-ink md:text-[2.1rem]">
          <Link href={`/projeler/${project.slug}`} className="link-underline">
            {project.title}
          </Link>
        </Heading>
        <p className="mt-4 text-muted-foreground">{project.summary}</p>
        {project.technologies.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Kullanılan teknolojiler">
            {project.technologies.map((t) => (
              <li key={t} className="rounded-sm bg-mist px-2.5 py-1 text-sm text-ink/80">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
