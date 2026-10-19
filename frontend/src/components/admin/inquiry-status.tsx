import type { InquiryStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  New: "Yeni",
  InProgress: "İşlemde",
  Completed: "Tamamlandı",
};

const styles: Record<InquiryStatus, string> = {
  New: "bg-signal/25 text-ink",
  InProgress: "bg-teal/10 text-teal",
  Completed: "bg-mist text-muted-foreground",
};

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {inquiryStatusLabels[status]}
    </span>
  );
}
