"use client";

import { useEffect, useRef } from "react";

/**
 * 跟随鼠标的柔和光晕（放在门户最上层，pointer-events-none）
 * 用 rAF 平滑跟随，制造"手电筒/能量场"感。
 */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    // 触屏设备不启用
    if (window.matchMedia("(hover: none)").matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;
    let animating = false;

    function loop() {
      x += (tx - x) * 0.15;
      y += (ty - y) * 0.15;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${x - 250}px, ${y - 250}px, 0)`;
      }
      // 已足够接近目标则停止 rAF，鼠标再动时唤醒（避免静止时空转）
      if (Math.abs(tx - x) < 0.5 && Math.abs(ty - y) < 0.5) {
        animating = false;
        return;
      }
      raf = requestAnimationFrame(loop);
    }
    function wake() {
      if (!animating) {
        animating = true;
        raf = requestAnimationFrame(loop);
      }
    }

    function onMove(e: MouseEvent) {
      tx = e.clientX;
      ty = e.clientY;
      if (ref.current) ref.current.style.opacity = "1";
      wake();
    }
    function onLeave() {
      if (ref.current) ref.current.style.opacity = "0";
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-30 h-[500px] w-[500px] rounded-full opacity-0 transition-opacity duration-500"
      style={{
        background:
          "radial-gradient(circle, rgba(120,120,255,0.10) 0%, rgba(180,80,255,0.06) 35%, transparent 70%)",
        mixBlendMode: "screen",
      }}
    />
  );
}
