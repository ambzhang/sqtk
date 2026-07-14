"use client";

import { useEffect, useRef } from "react";

/** 顶部滚动进度霓虹光条 */
export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
        if (ref.current) ref.current.style.transform = `scaleX(${scrolled})`;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed left-0 top-0 z-40 h-[3px] w-full origin-left scale-x-0"
      style={{
        background: "linear-gradient(90deg,#60a5fa,#a78bfa,#22d3ee,#ec4899)",
        boxShadow: "0 0 12px rgba(120,120,255,0.8)",
      }}
    />
  );
}
