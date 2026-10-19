import type { Metadata } from "next";
import { AdminProviders } from "@/components/admin/providers";

export const metadata: Metadata = {
  title: { default: "Yönetim paneli", template: "%s | Veykivo Panel" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminProviders>{children}</AdminProviders>;
}
