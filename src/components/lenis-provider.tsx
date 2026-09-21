"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const EASING = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

// Fixed page navs (landing, pricing) are 56px tall, anchors stay clear of them
const ANCHOR_OFFSET = -64;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Motion sensitive users keep the browser's native scrolling
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: EASING,
      smoothWheel: true,
      touchMultiplier: 1.5,
      wheelMultiplier: 1,
      autoRaf: true,
      autoResize: true,
      stopInertiaOnNavigate: true,
      // Inner scroll areas (chat list, kanban, textareas, sidebars) keep native
      // scrolling, Lenis only takes over when there is nothing left to scroll.
      allowNestedScroll: true,
    });

    lenisRef.current = lenis;

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // In page anchors (landing and pricing navs) glide through Lenis
  useEffect(() => {
    const onClickEvent = (event: MouseEvent) => {
      const lenis = lenisRef.current;
      if (!lenis || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const element = event.target as Element | null;
      const link = element?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname !== window.location.pathname || !url.hash || url.hash === "#") return;

      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target, { offset: ANCHOR_OFFSET, duration: 1.1 });
      window.history.replaceState(null, "", url.hash);
    };

    document.addEventListener("click", onClickEvent);
    return () => document.removeEventListener("click", onClickEvent);
  }, []);

  // A route change swaps the page, so the scroll limits need measuring again
  useEffect(() => {
    lenisRef.current?.resize();
  }, [pathname]);

  return <>{children}</>;
}
