"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";

interface Props {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

const EASING = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

/**
 * Smooth scrolling for a scrollable pane (used by the dashboard pages).
 *
 * The element itself stays the scroll container, so no extra wrapper is added
 * and the existing layout is untouched. Lenis is only attached while the pane
 * really overflows, otherwise wheel events would be swallowed on screens where
 * the page itself scrolls (mobile and tablet widths).
 */
export default function LenisScroll({ children, style, className }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    // Motion sensitive users keep the browser's native scrolling
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isScrollable = () => wrapper.scrollHeight - wrapper.clientHeight > 1;

    const enable = () => {
      if (lenisRef.current || !isScrollable()) return;
      lenisRef.current = new Lenis({
        wrapper,
        content: wrapper,
        duration: 1.1,
        easing: EASING,
        smoothWheel: true,
        touchMultiplier: 1.5,
        wheelMultiplier: 1,
        autoRaf: true,
        autoResize: true,
        // Anything scrollable inside the pane (textareas, lists, grids) keeps
        // native scrolling instead of being hijacked by this instance.
        allowNestedScroll: true,
      });
    };

    const disable = () => {
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };

    const sync = () => {
      if (isScrollable()) enable();
      else disable();
    };

    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(wrapper);
    for (const child of Array.from(wrapper.children)) observer.observe(child);

    return () => {
      observer.disconnect();
      disable();
    };
  }, []);

  // Panes grow and shrink (new tasks, filters, responsive layout)
  useEffect(() => {
    lenisRef.current?.resize();
  });

  return (
    <div ref={wrapperRef} className={className} style={style}>
      {children}
    </div>
  );
}
