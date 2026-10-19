"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Görünür alana girince `data-visible="true"` atar; CSS tarafı (ör. .reveal-mask) hareketi yönetir.
 * Bir kez tetiklenir, böylece geri kaydırmada içerik tekrar gizlenmez.
 */
export function useInView<T extends Element>(options: IntersectionObserverInit = { threshold: 0.2 }) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, visible };
}

export function RevealMask({ className, children }: { className?: string; children: React.ReactNode }) {
  const { ref, visible } = useInView<HTMLDivElement>({ threshold: 0.25 });
  // Gözlenen öğe dış sarmalayıcıdır: Chrome, hedefin kendi clip-path'ini kesişim hesabına katıyor.
  return (
    <div ref={ref} className={className}>
      <div data-visible={visible} className="reveal-mask overflow-hidden">
        {children}
      </div>
    </div>
  );
}
