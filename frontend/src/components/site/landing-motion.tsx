"use client";

import { useEffect, useRef } from "react";

export function LandingMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    let revert = () => undefined as void;
    async function setup() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const context = gsap.context(() => {
          gsap.utils.toArray<HTMLElement>(".landing-service-card").forEach((card, index) => {
            gsap.fromTo(card, { y: 50 + (index % 3) * 20 }, {
              y: 0, ease: "none", scrollTrigger: { trigger: card, start: "top 95%", end: "top 58%", scrub: 0.7 },
            });
          });
          gsap.utils.toArray<HTMLElement>(".landing-project-media").forEach((card) => {
            gsap.fromTo(card.querySelector("img"), { yPercent: -6 }, {
              yPercent: 6, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 0.8 },
            });
          });
        }, root);
        return () => context.revert();
      });
      revert = () => media.revert();
    }
    setup().catch(() => undefined);
    return () => { cancelled = true; revert(); };
  }, []);
  return <div ref={root} className="landing-page">{children}</div>;
}
