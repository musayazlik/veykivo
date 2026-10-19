import {
  AppWindow,
  Boxes,
  CodeXml,
  Compass,
  Database,
  Layers,
  ShieldCheck,
  Smartphone,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/** Panelde hizmete verilen ikon adı → Lucide bileşeni. Bilinmeyen ad gelirse genel ikon kullanılır. */
const icons: Record<string, LucideIcon> = {
  "code-xml": CodeXml,
  "app-window": AppWindow,
  smartphone: Smartphone,
  boxes: Boxes,
  workflow: Workflow,
  compass: Compass,
  database: Database,
  "shield-check": ShieldCheck,
  layers: Layers,
};

export const serviceIconNames = Object.keys(icons);

export function ServiceIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  const Icon = (name && icons[name]) || Layers;
  return <Icon aria-hidden className={className} strokeWidth={1.75} />;
}
