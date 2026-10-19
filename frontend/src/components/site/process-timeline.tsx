"use client";

import { useInView } from "./reveal";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Keşif",
    duration: "1–2 hafta",
    text: "Süreç atölyeleriyle işinizin bugün nasıl yürüdüğünü ve nerede tıkandığını birlikte çıkarıyoruz.",
  },
  {
    title: "Tasarım ve prototip",
    duration: "2–3 hafta",
    text: "Ekranları tıklanabilir bir prototipte kullanıcılarınızla doğruluyor, veri modelini netleştiriyoruz.",
  },
  {
    title: "Geliştirme",
    duration: "2 haftalık döngüler",
    text: "Her döngünün sonunda çalışan bir sürüm görürsünüz; öncelikleri birlikte güncelleriz.",
  },
  {
    title: "Yayın ve destek",
    duration: "Sürekli",
    text: "Canlıya geçişi, ekip eğitimini ve sonrasındaki bakım ile iyileştirmeleri üstleniyoruz.",
  },
];

/** Gerçek bir sıra olduğu için numaralı; görünür olunca çizgi soldan sağa dolar ve adımlar sırayla yanar. */
export function ProcessTimeline() {
  const { ref, visible } = useInView<HTMLOListElement>({ threshold: 0.35 });

  return (
    <ol ref={ref} className="relative grid gap-10 md:grid-cols-4 md:gap-8">
      <span aria-hidden className="absolute top-5 right-0 left-0 hidden h-px bg-white/15 md:block" />
      <span
        aria-hidden
        className="absolute top-5 left-0 hidden h-px origin-left bg-signal transition-transform duration-[1800ms] ease-(--ease-in-out-quart) md:block"
        style={{ width: "100%", transform: `scaleX(${visible ? 1 : 0})` }}
      />
      <span aria-hidden className="absolute top-0 bottom-0 left-5 w-px bg-white/15 md:hidden" />

      {STEPS.map((step, i) => (
        <li key={step.title} className="relative pl-16 md:pl-0">
          <span
            className={cn(
              "absolute top-0 left-0 flex size-10 items-center justify-center rounded-full border text-sm font-bold tabular-nums transition-[background-color,color,border-color] duration-500 md:relative",
              visible ? "border-signal bg-signal text-ink" : "border-white/25 bg-ink text-on-ink-muted",
            )}
            style={{ transitionDelay: visible ? `${300 + i * 400}ms` : "0ms" }}
          >
            {i + 1}
          </span>
          <h3 className="mt-0 text-h3 text-on-ink md:mt-6">{step.title}</h3>
          <p className="mt-1 text-sm font-medium text-signal">{step.duration}</p>
          <p className="mt-3 text-on-ink-muted">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
