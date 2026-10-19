"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/*
 * Hero'nun imza öğesi: ayrı iş birimlerini tek bir çekirdeğe bağlayan sistem şeması.
 * Açılışta bağlantılar çizilir, ardından modüller arasında veri paketleri akar ve
 * alttaki günlükte gerçekçi iş olayları belirir. prefers-reduced-motion'da statik kalır.
 */

type NodeId = "siparis" | "stok" | "finans" | "saha" | "portal" | "rapor";

const NODES: Record<NodeId, { label: string; x: number; y: number }> = {
  siparis: { label: "Sipariş", x: 90, y: 70 },
  stok: { label: "Stok", x: 470, y: 70 },
  finans: { label: "Finans", x: 490, y: 220 },
  saha: { label: "Saha ekibi", x: 470, y: 370 },
  portal: { label: "Müşteri portalı", x: 90, y: 370 },
  rapor: { label: "Raporlar", x: 70, y: 220 },
};

// Her yol düğümden çekirdeğe gider; dik açılı hatlar devre/şema hissi verir.
const EDGES: Record<NodeId, string> = {
  siparis: "M150 70 H240 V188",
  stok: "M410 70 H320 V188",
  finans: "M430 220 H355",
  saha: "M410 370 H320 V252",
  portal: "M150 370 H240 V252",
  rapor: "M130 220 H205",
};

const EVENTS: { from: NodeId; to: NodeId; text: string }[] = [
  { from: "siparis", to: "stok", text: "Sipariş #2418 onaylandı, stoktan 24 adet düşüldü" },
  { from: "saha", to: "finans", text: "Teslimat imzalandı, e-fatura otomatik kesildi" },
  { from: "portal", to: "siparis", text: "Müşteri portalından yeni sipariş: 3 kalem" },
  { from: "stok", to: "rapor", text: "Kritik stok: rulman 6204 için satın alma talebi açıldı" },
  { from: "siparis", to: "saha", text: "Sevkiyat rotası hazırlandı: 14 durak, 2 araç" },
  { from: "finans", to: "rapor", text: "Günlük tahsilat özeti yönetim paneline düştü" },
];

const ORDER: NodeId[] = ["siparis", "stok", "finans", "saha", "portal", "rapor"];

type LogEntry = { id: number; text: string; at: number };

export function SystemDiagram({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const packetRef = useRef<SVGCircleElement>(null);
  const [active, setActive] = useState<NodeId | null>(null);
  const [log, setLog] = useState<LogEntry[]>(() =>
    EVENTS.slice(-3).reverse().map((e, i) => ({ id: -i - 1, text: e.text, at: 0 })),
  );
  const [now, setNow] = useState(0);

  useEffect(() => {
    const svg = svgRef.current;
    const packet = packetRef.current;
    if (!svg || !packet) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout>;
    let index = 0;
    let visible = true;

    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    observer.observe(svg);

    const pathFor = (id: NodeId) => svg.querySelector<SVGPathElement>(`[data-edge="${id}"]`)!;

    const travel = (path: SVGPathElement, reverse: boolean, duration: number) =>
      new Promise<void>((resolve) => {
        const length = path.getTotalLength();
        const start = performance.now();
        const step = (t: number) => {
          if (cancelled) return resolve();
          const p = Math.min(1, (t - start) / duration);
          const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          const pt = path.getPointAtLength(reverse ? length * (1 - eased) : length * eased);
          packet.setAttribute("cx", String(pt.x));
          packet.setAttribute("cy", String(pt.y));
          if (p < 1) raf = requestAnimationFrame(step);
          else resolve();
        };
        raf = requestAnimationFrame(step);
      });

    const run = async () => {
      if (cancelled) return;
      if (!visible || document.hidden) {
        timer = setTimeout(run, 800);
        return;
      }
      const event = EVENTS[index % EVENTS.length];
      index++;

      setActive(event.from);
      packet.style.opacity = "1";
      await travel(pathFor(event.from), false, 900);
      await travel(pathFor(event.to), true, 900);
      if (cancelled) return;
      packet.style.opacity = "0";
      setActive(event.to);
      const at = Date.now();
      setNow(at);
      setLog((prev) => [{ id: at, text: event.text, at }, ...prev].slice(0, 3));
      timer = setTimeout(run, 1600);
    };

    // Bağlantıların çizimi bittikten sonra akış başlar.
    timer = setTimeout(run, 2200);
    const clock = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      clearInterval(clock);
      observer.disconnect();
    };
  }, []);

  return (
    <figure className={cn("notch blueprint-dark relative bg-ink text-on-ink", className)}>
      <figcaption className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3.5 text-sm">
        <span className="font-medium text-on-ink">Örnek: üretim firması için kurduğumuz akış</span>
        <span className="flex shrink-0 items-center gap-2 text-on-ink-muted">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal/70 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-signal" />
          </span>
          Canlı
        </span>
      </figcaption>

      <svg
        ref={svgRef}
        viewBox="0 0 560 440"
        role="img"
        aria-label="Sipariş, stok, finans, saha ekibi, müşteri portalı ve raporlar modüllerinin tek bir Veykivo çekirdeğine bağlandığı sistem şeması"
        className="block h-auto w-full px-2 pt-2"
      >
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {ORDER.map((id, i) => (
            <path
              key={id}
              data-edge={id}
              d={EDGES[id]}
              pathLength={1}
              stroke={active === id ? "var(--signal)" : "rgb(232 239 238 / 0.32)"}
              strokeWidth={2}
              strokeDasharray="1"
              strokeDashoffset="1"
              style={{
                animation: `vk-draw 0.9s var(--ease-in-out-quart) ${0.35 + i * 0.12}s forwards`,
                transition: "stroke 0.4s",
              }}
            />
          ))}
        </g>

        {/* Çekirdek */}
        <g style={{ animation: "vk-pop 0.6s var(--ease-out-quart) 0.1s both", transformOrigin: "280px 220px" }}>
          <rect x="205" y="188" width="150" height="64" rx="6" fill="var(--signal)" />
          <text x="280" y="216" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink)">
            Veykivo çekirdeği
          </text>
          <text x="280" y="236" textAnchor="middle" fontSize="11.5" fontWeight="500" fill="var(--ink)" opacity="0.75">
            tek veri kaynağı
          </text>
        </g>

        {ORDER.map((id, i) => {
          const n = NODES[id];
          const w = id === "portal" ? 132 : 112;
          const isActive = active === id;
          return (
            <g
              key={id}
              style={{
                animation: `vk-pop 0.55s var(--ease-out-quart) ${0.9 + i * 0.1}s both`,
                transformOrigin: `${n.x}px ${n.y}px`,
              }}
            >
              {isActive && (
                <circle cx={n.x} cy={n.y} r="6" fill="none" stroke="var(--signal)" strokeWidth="2">
                  <animate attributeName="r" from="20" to="60" dur="0.9s" fill="freeze" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="0.9s" fill="freeze" />
                </circle>
              )}
              <rect
                x={n.x - w / 2}
                y={n.y - 22}
                width={w}
                height="44"
                rx="6"
                fill="var(--ink-2)"
                stroke={isActive ? "var(--signal)" : "rgb(232 239 238 / 0.28)"}
                strokeWidth={isActive ? 2 : 1.25}
                style={{ transition: "stroke 0.35s" }}
              />
              <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--on-ink)">
                {n.label}
              </text>
            </g>
          );
        })}

        <circle ref={packetRef} r="5.5" cx="-20" cy="-20" fill="var(--signal)" style={{ opacity: 0, transition: "opacity 0.2s" }} />
      </svg>

      <ol aria-hidden className="space-y-2 border-t border-white/10 px-5 py-4 text-[0.9rem]">
        {log.map((entry, i) => (
          <li
            key={entry.id}
            className={cn("flex items-baseline gap-3", i === 0 ? "text-on-ink" : "text-on-ink-muted")}
            style={i === 0 && entry.at ? { animation: "vk-log-in 0.45s var(--ease-out-quart)" } : undefined}
          >
            <span className={cn("size-1.5 shrink-0 translate-y-[-1px] rounded-full", i === 0 ? "bg-signal" : "bg-on-ink-muted/50")} />
            <span className="min-w-0 flex-1 truncate">{entry.text}</span>
            <span className="shrink-0 text-xs tabular-nums text-on-ink-muted">{ago(entry.at, now)}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

function ago(at: number, now: number) {
  if (!at || !now) return "az önce";
  const s = Math.max(0, Math.round((now - at) / 1000));
  return s < 3 ? "şimdi" : `${s} sn önce`;
}
