"use client";

import { useEffect, useRef } from "react";

/**
 * 深空星空 + 连线粒子动效背景（Canvas 实现，高性能）
 * - 缓慢漂移的星点
 * - 邻近粒子自动连线，形成星座网络
 * - 跟随鼠标产生轻微视差与吸引
 */
export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const COUNT = Math.min(120, Math.floor((width * height) / 14000));
    const stars = Array.from({ length: COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.4,
      hue: Math.random() > 0.5 ? 210 : 270, // 蓝 / 紫
      tw: Math.random() * Math.PI * 2, // 闪烁相位
    }));

    const mouse = { x: width / 2, y: height / 2, active: false };

    function onMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }
    function onLeave() {
      mouse.active = false;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    window.addEventListener("resize", resize);

    let raf = 0;
    let t = 0;

    function draw() {
      t += 0.01;
      ctx!.clearRect(0, 0, width, height);

      // 星点
      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;

        // 鼠标轻微吸引
        if (mouse.active) {
          const dx = mouse.x - s.x;
          const dy = mouse.y - s.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 180) {
            s.x += (dx / dist) * 0.15;
            s.y += (dy / dist) * 0.15;
          }
        }

        // 边界回绕
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        const twinkle = 0.5 + 0.5 * Math.sin(t * 2 + s.tw);
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${s.hue}, 90%, 70%, ${0.35 + twinkle * 0.5})`;
        ctx!.shadowBlur = 8;
        ctx!.shadowColor = `hsla(${s.hue}, 90%, 65%, 0.8)`;
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;

      // 邻近连线
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const a = stars[i];
          const b = stars[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < 120) {
            const alpha = (1 - d / 120) * 0.35;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.strokeStyle = `hsla(230, 90%, 75%, ${alpha})`;
            ctx!.lineWidth = 0.6;
            ctx!.stroke();
          }
        }
      }

      // 鼠标处光晕连线
      if (mouse.active) {
        for (const s of stars) {
          const d = Math.hypot(mouse.x - s.x, mouse.y - s.y);
          if (d < 160) {
            const alpha = (1 - d / 160) * 0.5;
            ctx!.beginPath();
            ctx!.moveTo(mouse.x, mouse.y);
            ctx!.lineTo(s.x, s.y);
            ctx!.strokeStyle = `hsla(270, 95%, 78%, ${alpha})`;
            ctx!.lineWidth = 0.7;
            ctx!.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
