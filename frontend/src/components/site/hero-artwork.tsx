"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

/** WebGL yalnızca bu görselde yüklenir; diğer sayfalar Three.js indirmez. */
export function HeroArtwork() {
  const host = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const refresh = useRef<() => void>(() => undefined);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    let cleanup = () => undefined as void;

    async function setup() {
      const [THREE, { RoomEnvironment }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/environments/RoomEnvironment.js"),
      ]);
      if (disposed || !element) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); }
      catch { return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      element.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
      camera.position.set(0, 0, 7.8);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const studio = new RoomEnvironment();
      const environment = pmrem.fromScene(studio, 0.04);
      scene.environment = environment.texture;
      studio.dispose();

      const group = new THREE.Group();
      scene.add(group);
      const geometry = new THREE.TorusKnotGeometry(1.2, 0.29, 160, 28, 2, 3);
      const material = new THREE.MeshPhysicalMaterial({
        color: 0xbfcaff, metalness: 1, roughness: 0.16,
        clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.8,
      });
      const sculpture = new THREE.Mesh(geometry, material);
      sculpture.rotation.set(0.25, -0.3, -0.45);
      group.add(sculpture);
      const blue = new THREE.PointLight(0x447aff, 38, 12);
      blue.position.set(-3, -1, 3);
      const violet = new THREE.PointLight(0xa690ff, 24, 12);
      violet.position.set(3, 2, -1);
      scene.add(blue, violet, new THREE.AmbientLight(0x9aaaff, 0.3));

      const orbitGeometry = new THREE.TorusGeometry(2.1, 0.006, 6, 150);
      const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0x7897f1, transparent: true, opacity: 0.2 });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.set(1.1, 0.3, 0.4);
      group.add(orbit);
      const orbitTwo = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbitTwo.rotation.set(0.3, 0.9, -0.6);
      group.add(orbitTwo);

      const particleGeometry = new THREE.BufferGeometry();
      const coordinates = new Float32Array(72 * 3);
      for (let i = 0; i < 72; i++) {
        const angle = i * 2.39996;
        const radius = 2.5 + (i % 7) * 0.12;
        coordinates[i * 3] = Math.cos(angle) * radius;
        coordinates[i * 3 + 1] = Math.sin(angle) * radius;
        coordinates[i * 3 + 2] = (i % 9) * 0.2 - 1;
      }
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(coordinates, 3));
      const particleMaterial = new THREE.PointsMaterial({ color: 0xb0c3ff, size: 0.018, transparent: true, opacity: 0.5 });
      group.add(new THREE.Points(particleGeometry, particleMaterial));

      const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
      const pointer = { x: 0, y: 0 };
      let frame = 0;
      let visible = true;
      let elapsed = 0;
      let previousTime = 0;
      const canAnimate = () => !disposed && visible && !document.hidden && !pausedRef.current && !preference.matches;
      function draw(time: number) {
        frame = 0;
        if (disposed) return;
        const delta = previousTime ? Math.min(time - previousTime, 50) : 0;
        previousTime = time;
        if (canAnimate()) {
          elapsed += delta * 0.001;
          sculpture.rotation.y = -0.3 + elapsed * 0.12;
          sculpture.position.y = Math.sin(elapsed * 0.65) * 0.08;
          group.rotation.y += (pointer.x * 0.16 - group.rotation.y) * 0.035;
          group.rotation.x += (-pointer.y * 0.12 - group.rotation.x) * 0.035;
        }
        renderer.render(scene, camera);
        if (canAnimate()) frame = requestAnimationFrame(draw);
      }
      function reconcile() {
        if (frame) cancelAnimationFrame(frame);
        previousTime = 0;
        frame = requestAnimationFrame(draw);
      }
      refresh.current = reconcile;
      function resize() {
        const width = element!.clientWidth;
        const height = element!.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        reconcile();
      }
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(element);
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; reconcile(); });
      observer.observe(element);
      const interaction = element.closest("section") ?? element;
      const onPointer = (event: Event) => {
        const e = event as PointerEvent;
        const rect = interaction.getBoundingClientRect();
        pointer.x = (e.clientX - rect.left) / rect.width - 0.5;
        pointer.y = (e.clientY - rect.top) / rect.height - 0.5;
      };
      interaction.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("visibilitychange", reconcile);
      preference.addEventListener("change", reconcile);
      resize();
      setReady(true);
      cleanup = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        observer.disconnect();
        interaction.removeEventListener("pointermove", onPointer);
        document.removeEventListener("visibilitychange", reconcile);
        preference.removeEventListener("change", reconcile);
        geometry.dispose(); material.dispose(); orbitGeometry.dispose(); orbitMaterial.dispose();
        particleGeometry.dispose(); particleMaterial.dispose(); environment.dispose(); pmrem.dispose();
        renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
        refresh.current = () => undefined;
      };
    }
    setup().catch(() => undefined);
    return () => { disposed = true; cleanup(); };
  }, []);

  return (
    <div className="hero-artwork">
      <div className="hero-artwork-stage" ref={host} aria-hidden="true">
        {!ready && <div className="hero-artwork-fallback"><span /><span /><span /></div>}
      </div>
      {ready && (
        <Button
          type="button" variant="ghost" size="icon" className="hero-motion-toggle"
          aria-label={paused ? "Animasyonu başlat" : "Animasyonu durdur"} aria-pressed={paused}
          onClick={() => { const next = !paused; pausedRef.current = next; setPaused(next); refresh.current(); }}
        >
          {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
        </Button>
      )}
    </div>
  );
}
