import Link from "next/link";
import { ArrowUpRight, Code2 } from "lucide-react";
import type { ProjectListItem } from "@/lib/api/types";
import { ContentImage } from "./content-image";

/** Proje listesinde kullanılan kart; ana sayfadaki çalışma kartlarıyla aynı dilde. */
export function ProjectCase({ project, headingLevel = "h3" }: { project: ProjectListItem; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <Link href={`/projeler/${project.slug}`} className="landing-project-card group block">
      <div className="landing-project-media">
        {project.coverImage ? (
          <ContentImage
            media={project.coverImage}
            sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1100px) 50vw, 700px"
            className="h-full bg-[#171c27]"
            fallbackLabel={project.title}
          />
        ) : (
          <div className="landing-project-fallback"><Code2 aria-hidden /></div>
        )}
        <span className="landing-project-category">{project.sector || "Özel yazılım"}</span>
        <span className="landing-project-open"><ArrowUpRight aria-hidden /><span className="sr-only">Projeyi incele</span></span>
      </div>
      <div className="landing-project-info">
        <div>
          <Heading>{project.title}</Heading>
          <p>{project.summary}</p>
        </div>
        {project.technologies.length > 0 && <span>{project.technologies.slice(0, 2).join(" / ")}</span>}
      </div>
    </Link>
  );
}
