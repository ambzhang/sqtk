"use client";

import { useEffect, useRef } from "react";

/**
 * 高级深空粒子特效背景（Canvas）
 * - 3D 视差星流：粒子带 z 深度，越近越大越亮，鼠标移动产生视差
 * - 鼠标力场：靠近鼠标的粒子被推开/吸引，形成扭曲涟漪
 * - 邻近连线：动态星座网络，颜色随深度渐变
 * - 随机流星：不定时从边缘划过，带拖尾
 * - 呼吸光波：中心周期性扩散的能量圈
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

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- 粒子（带 z 深度）----
    type Star = {
      x: number;
      y: number;
      z: number; // 0(远)~1(近)
      vx: number;
      vy: number;
      hue: number;
      tw: number;
    };
    const COUNT = reduce ? 60 : Math.min(180, Math.floor((width * height) / 11000));
    const HUES = [210, 265, 190, 320]; // 蓝 紫 青 品红
    const stars: Star[] = Array.from({ length: COUNT }, () => {
      const z = Math.random();
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        vx: (Math.random() - 0.5) * (0.15 + z * 0.35),
        vy: (Math.random() - 0.5) * (0.15 + z * 0.35),
        hue: HUES[(Math.random() * HUES.length) | 0],
        tw: Math.random() * Math.PI * 2,
      };
    });

    // ---- 流星 ----
    type Meteor = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      max: number;
      hue: number;
    };
    const meteors: Meteor[] = [];
    function spawnMeteor() {
      const fromLeft = Math.random() > 0.5;
      const y = Math.random() * height * 0.6;
      const speed = 7 + Math.random() * 6;
      const angle = (Math.random() * 0.3 + 0.15) * (fromLeft ? 1 : -1);
      meteors.push({
        x: fromLeft ? -60 : width + 60,
        y,
        vx: (fromLeft ? 1 : -1) * speed,
        vy: speed * angle + 2,
        life: 0,
        max: 80 + Math.random() * 40,
        hue: HUES[(Math.random() * HUES.length) | 0],
      });
    }

    const mouse = { x: width / 2, y: height / 2, active: false, px: width / 2, py: height / 2 };
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
    let meteorTimer = 0;

    // 视差偏移（鼠标偏离中心的比例）
    let parX = 0;
    let parY = 0;

    function draw() {
      t += 0.01;
      // 平滑视差
      const targetPX = ((mouse.x - width / 2) / width) * 40;
      const targetPY = ((mouse.y - height / 2) / height) * 40;
      parX += (targetPX - parX) * 0.05;
      parY += (targetPY - parY) * 0.05;

      // 拖尾清屏：半透明填充制造余晖
      ctx!.fillStyle = "rgba(7, 11, 22, 0.28)";
      ctx!.fillRect(0, 0, width, height);
      ctx!.globalCompositeOperation = "lighter";

      // ---- 呼吸光波 ----
      if (!reduce) {
        const pulse = (t * 0.35) % 2;
        for (let k = 0; k < 2; k++) {
          const p = (pulse + k) % 2;
          const radius = p * Math.max(width, height) * 0.6;
          const a = (1 - p / 2) * 0.08;
          if (a > 0.002) {
            ctx!.beginPath();
            ctx!.arc(width / 2, height * 0.42, radius, 0, Math.PI * 2);
            ctx!.strokeStyle = `hsla(250, 90%, 70%, ${a})`;
            ctx!.lineWidth = 2;
            ctx!.stroke();
          }
        }
      }

      // ---- 星点 ----
      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;

        // 鼠标力场：近处推开形成涟漪
        if (mouse.active) {
          const dx = s.x - mouse.x;
          const dy = s.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          const R = 160;
          if (dist < R && dist > 0.01) {
            const force = (1 - dist / R) * 1.4 * s.z;
            s.x += (dx / dist) * force;
            s.y += (dy / dist) * force;
          }
        }

        // 边界回绕
        if (s.x < -20) s.x = width + 20;
        if (s.x > width + 20) s.x = -20;
        if (s.y < -20) s.y = height + 20;
        if (s.y > height + 20) s.y = -20;

        const px = s.x + parX * s.z;
        const py = s.y + parY * s.z;
        const r = (0.4 + s.z * 2.2);
        const twinkle = 0.5 + 0.5 * Math.sin(t * 2 + s.tw);
        const alpha = (0.2 + s.z * 0.6) * (0.5 + twinkle * 0.5);

        ctx!.beginPath();
        ctx!.arc(px, py, r, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${s.hue}, 95%, ${65 + s.z * 15}%, ${alpha})`;
        ctx!.shadowBlur = 6 + s.z * 10;
        ctx!.shadowColor = `hsla(${s.hue}, 95%, 65%, 0.9)`;
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;

      // ---- 邻近连线（只连较近的粒子，含深度感）----
      const LINK = 130;
      for (let i = 0; i < stars.length; i++) {
        const a = stars[i];
        const ax = a.x + parX * a.z;
        const ay = a.y + parY * a.z;
        for (let j = i + 1; j < stars.length; j++) {
          const b = stars[j];
          const bx = b.x + parX * b.z;
          const by = b.y + parY * b.z;
          const dx = ax - bx;
          const dy = ay - by;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const d = Math.sqrt(d2);
            const alpha = (1 - d / LINK) * 0.28 * ((a.z + b.z) / 2 + 0.3);
            ctx!.beginPath();
            ctx!.moveTo(ax, ay);
            ctx!.lineTo(bx, by);
            ctx!.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 90%, 72%, ${alpha})`;
            ctx!.lineWidth = 0.6 + ((a.z + b.z) / 2) * 0.6;
            ctx!.stroke();
          }
        }
      }

      // ---- 鼠标光晕连线 ----
      if (mouse.active) {
        for (const s of stars) {
          const px = s.x + parX * s.z;
          const py = s.y + parY * s.z;
          const d = Math.hypot(mouse.x - px, mouse.y - py);
          if (d < 200) {
            const alpha = (1 - d / 200) * 0.5;
            ctx!.beginPath();
            ctx!.moveTo(mouse.x, mouse.y);
            ctx!.lineTo(px, py);
            ctx!.strokeStyle = `hsla(${s.hue}, 95%, 78%, ${alpha})`;
            ctx!.lineWidth = 0.8;
            ctx!.stroke();
          }
        }
        // 鼠标核心光点
        ctx!.beginPath();
        ctx!.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
        ctx!.fillStyle = "hsla(280, 100%, 80%, 0.9)";
        ctx!.shadowBlur = 20;
        ctx!.shadowColor = "hsla(280, 100%, 70%, 1)";
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      // ---- 流星 ----
      if (!reduce) {
        meteorTimer--;
        if (meteorTimer <= 0 && meteors.length < 3) {
          spawnMeteor();
          meteorTimer = 120 + Math.random() * 240;
        }
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.x += m.vx;
          m.y += m.vy;
          m.life++;
          const tailX = m.x - m.vx * 5;
          const tailY = m.y - m.vy * 5;
          const grad = ctx!.createLinearGradient(m.x, m.y, tailX, tailY);
          grad.addColorStop(0, `hsla(${m.hue}, 100%, 80%, 0.95)`);
          grad.addColorStop(1, `hsla(${m.hue}, 100%, 70%, 0)`);
          ctx!.beginPath();
          ctx!.moveTo(m.x, m.y);
          ctx!.lineTo(tailX, tailY);
          ctx!.strokeStyle = grad;
          ctx!.lineWidth = 2.2;
          ctx!.lineCap = "round";
          ctx!.stroke();
          // 头部亮点
          ctx!.beginPath();
          ctx!.arc(m.x, m.y, 2, 0, Math.PI * 2);
          ctx!.fillStyle = `hsla(${m.hue}, 100%, 90%, 0.95)`;
          ctx!.shadowBlur = 14;
          ctx!.shadowColor = `hsla(${m.hue}, 100%, 75%, 1)`;
          ctx!.fill();
          ctx!.shadowBlur = 0;
          if (m.life > m.max || m.x < -80 || m.x > width + 80 || m.y > height + 80) {
            meteors.splice(i, 1);
          }
        }
      }

      ctx!.globalCompositeOperation = "source-over";
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
