import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const actionVariants = cva(
  "group/action relative inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-[0.975rem] font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-[1.1em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Sodyum amber yalnızca birincil eylemde kullanılır.
        primary: "bg-signal text-ink shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] hover:bg-signal-strong",
        dark: "bg-ink text-on-ink hover:bg-ink-2",
        outline: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-on-ink",
        "outline-light": "border border-on-ink/30 text-on-ink hover:border-on-ink hover:bg-on-ink hover:text-ink",
        text: "min-h-0 px-0 text-teal underline-offset-4 hover:underline",
      },
      size: {
        md: "",
        lg: "min-h-13 px-7 text-[1.05rem]",
        sm: "min-h-9 px-3.5 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ActionLinkProps = React.ComponentProps<typeof Link> & VariantProps<typeof actionVariants>;

export function ActionLink({ className, variant, size, ...props }: ActionLinkProps) {
  return <Link className={cn(actionVariants({ variant, size }), className)} {...props} />;
}
