"use client";

import { useRef, ReactNode } from "react";

/**
 * 鼠标跟随的 3D 倾斜卡片
 * - 鼠标在卡片上移动时，卡片按位置产生 3D 透视倾斜
 * - 一个跟随鼠标的高光光斑（--mx / --my）
 * - 离开时平滑复位
 */
export default function TiltCard({
  children,
  className = "",
  max = 12,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef<number>(0);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0~1
    const y = (e.clientY - rect.top) / rect.height;
    const rotY = (x - 0.5) * max * 2;
    const rotX = -(y - 0.5) * max * 2;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--rx", `${rotX}deg`);
      el.style.setProperty("--ry", `${rotY}deg`);
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
      el.style.setProperty("--tz", "1");
    });
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--tz", "0");
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt-card ${className}`}
    >
      <div className="tilt-inner">{children}</div>
      <span className="tilt-glow" aria-hidden="true" />
    </div>
  );
}
