"use client";

import { useEffect, useRef } from "react";

/**
 * 深空粒子特效背景（Canvas）——性能优化版
 * - 3D 视差星流：粒子带 z 深度，鼠标移动产生视差
 * - 鼠标力场：靠近鼠标的粒子被推开，形成涟漪
 * - 邻近连线：空间网格分桶（近似 O(n)），动态星座网络
 * - 随机流星：不定时划过，带拖尾
 * - 呼吸光波：中心周期性扩散能量圈
 *
 * 性能要点：
 * - 完全移除逐粒子 shadowBlur（Canvas 最大性能杀手）
 * - 连线用网格分桶，避免 O(n²) 全量两两比较
 * - 页面不可见时暂停动画（visibilitychange）
 */
export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
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
    // 适度降低粒子数：视觉密度基本不变，两两连线成本大幅下降
    const COUNT = reduce ? 40 : Math.min(120, Math.floor((width * height) / 16000));
    const HUES = [210, 265, 190, 320]; // 蓝 紫 青 品红
    const stars: Star[] = Array.from({ length: COUNT }, () => {
      const z = Math.random();
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        vx: (Math.random() - 0.5) * (0.12 + z * 0.28),
        vy: (Math.random() - 0.5) * (0.12 + z * 0.28),
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

    const mouse = { x: width / 2, y: height / 2, active: false };
    function onMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }
    function onLeave() {
      mouse.active = false;
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", onLeave);
    window.addEventListener("resize", resize);

    let raf = 0;
    let running = true;
    let t = 0;
    let meteorTimer = 0;

    // 视差偏移
    let parX = 0;
    let parY = 0;

    // 连线用网格分桶
    const LINK = 130;
    const LINK2 = LINK * LINK;

    // 帧率节流：目标约 45fps，降低持续 GPU 负载但保持顺滑
    const FRAME_MS = 1000 / 45;
    let lastTime = 0;

    function draw(now: number) {
      raf = requestAnimationFrame(draw);
      if (now - lastTime < FRAME_MS) return;
      lastTime = now;

      t += 0.012;
      const targetPX = ((mouse.x - width / 2) / width) * 36;
      const targetPY = ((mouse.y - height / 2) / height) * 36;
      parX += (targetPX - parX) * 0.05;
      parY += (targetPY - parY) * 0.05;

      // 拖尾清屏：半透明填充制造余晖
      ctx!.globalCompositeOperation = "source-over";
      ctx!.fillStyle = "rgba(7, 11, 22, 0.32)";
      ctx!.fillRect(0, 0, width, height);
      ctx!.globalCompositeOperation = "lighter";

      // ---- 呼吸光波 ----
      if (!reduce) {
        const pulse = (t * 0.35) % 2;
        for (let k = 0; k < 2; k++) {
          const p = (pulse + k) % 2;
          const radius = p * Math.max(width, height) * 0.6;
          const a = (1 - p / 2) * 0.07;
          if (a > 0.003) {
            ctx!.beginPath();
            ctx!.arc(width / 2, height * 0.42, radius, 0, Math.PI * 2);
            ctx!.strokeStyle = `hsla(250, 90%, 70%, ${a})`;
            ctx!.lineWidth = 2;
            ctx!.stroke();
          }
        }
      }

      // 预计算屏幕坐标（含视差），供连线复用，避免重复计算
      const sx = new Float32Array(stars.length);
      const sy = new Float32Array(stars.length);

      // ---- 更新 + 绘制星点（无 shadowBlur）----
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.vx;
        s.y += s.vy;

        // 鼠标力场
        if (mouse.active) {
          const dx = s.x - mouse.x;
          const dy = s.y - mouse.y;
          const dist2 = dx * dx + dy * dy;
          const R = 160;
          if (dist2 < R * R && dist2 > 0.01) {
            const dist = Math.sqrt(dist2);
            const force = (1 - dist / R) * 1.3 * s.z;
            s.x += (dx / dist) * force;
            s.y += (dy / dist) * force;
          }
        }

        // 边界回绕
        if (s.x < -20) s.x = width + 20;
        else if (s.x > width + 20) s.x = -20;
        if (s.y < -20) s.y = height + 20;
        else if (s.y > height + 20) s.y = -20;

        const px = s.x + parX * s.z;
        const py = s.y + parY * s.z;
        sx[i] = px;
        sy[i] = py;

        const r = 0.4 + s.z * 2.2;
        const twinkle = 0.5 + 0.5 * Math.sin(t * 2 + s.tw);
        const alpha = (0.25 + s.z * 0.6) * (0.55 + twinkle * 0.45);

        ctx!.beginPath();
        ctx!.arc(px, py, r, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${s.hue}, 95%, ${68 + s.z * 12}%, ${alpha})`;
        ctx!.fill();
      }

      // ---- 邻近连线（空间网格分桶，近似 O(n)）----
      const cols = Math.max(1, Math.ceil(width / LINK));
      const rows = Math.max(1, Math.ceil(height / LINK));
      const grid: number[][] = new Array(cols * rows);
      for (let i = 0; i < stars.length; i++) {
        const cx = Math.min(cols - 1, Math.max(0, (sx[i] / LINK) | 0));
        const cy = Math.min(rows - 1, Math.max(0, (sy[i] / LINK) | 0));
        const cell = cy * cols + cx;
        (grid[cell] || (grid[cell] = [])).push(i);
      }
      for (let i = 0; i < stars.length; i++) {
        const cx = Math.min(cols - 1, Math.max(0, (sx[i] / LINK) | 0));
        const cy = Math.min(rows - 1, Math.max(0, (sy[i] / LINK) | 0));
        // 只与右/下方相邻的 4 个格子比较，避免重复
        for (let gy = cy; gy <= cy + 1 && gy < rows; gy++) {
          for (let gx = cx - 1; gx <= cx + 1 && gx < cols; gx++) {
            if (gx < 0) continue;
            if (gy === cy && gx < cx) continue;
            const bucket = grid[gy * cols + gx];
            if (!bucket) continue;
            for (const j of bucket) {
              if (j <= i) continue;
              const dx = sx[i] - sx[j];
              const dy = sy[i] - sy[j];
              const d2 = dx * dx + dy * dy;
              if (d2 < LINK2) {
                const d = Math.sqrt(d2);
                const a = stars[i];
                const b = stars[j];
                const alpha = (1 - d / LINK) * 0.26 * ((a.z + b.z) / 2 + 0.3);
                ctx!.beginPath();
                ctx!.moveTo(sx[i], sy[i]);
                ctx!.lineTo(sx[j], sy[j]);
                ctx!.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 90%, 72%, ${alpha})`;
                ctx!.lineWidth = 0.6;
                ctx!.stroke();
              }
            }
          }
        }
      }

      // ---- 鼠标光晕连线（限制数量）----
      if (mouse.active) {
        let linked = 0;
        for (let i = 0; i < stars.length && linked < 12; i++) {
          const dx = mouse.x - sx[i];
          const dy = mouse.y - sy[i];
          const d2 = dx * dx + dy * dy;
          if (d2 < 200 * 200) {
            const alpha = (1 - Math.sqrt(d2) / 200) * 0.45;
            ctx!.beginPath();
            ctx!.moveTo(mouse.x, mouse.y);
            ctx!.lineTo(sx[i], sy[i]);
            ctx!.strokeStyle = `hsla(${stars[i].hue}, 95%, 78%, ${alpha})`;
            ctx!.lineWidth = 0.8;
            ctx!.stroke();
            linked++;
          }
        }
        // 鼠标核心光点（单点用径向渐变替代 shadowBlur）
        const g = ctx!.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 16);
        g.addColorStop(0, "hsla(280, 100%, 85%, 0.9)");
        g.addColorStop(1, "hsla(280, 100%, 70%, 0)");
        ctx!.beginPath();
        ctx!.arc(mouse.x, mouse.y, 16, 0, Math.PI * 2);
        ctx!.fillStyle = g;
        ctx!.fill();
      }

      // ---- 流星 ----
      if (!reduce) {
        meteorTimer--;
        if (meteorTimer <= 0 && meteors.length < 2) {
          spawnMeteor();
          meteorTimer = 150 + Math.random() * 260;
        }
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.x += m.vx;
          m.y += m.vy;
          m.life++;
          const tailX = m.x - m.vx * 5;
          const tailY = m.y - m.vy * 5;
          const grad = ctx!.createLinearGradient(m.x, m.y, tailX, tailY);
          grad.addColorStop(0, `hsla(${m.hue}, 100%, 82%, 0.95)`);
          grad.addColorStop(1, `hsla(${m.hue}, 100%, 70%, 0)`);
          ctx!.beginPath();
          ctx!.moveTo(m.x, m.y);
          ctx!.lineTo(tailX, tailY);
          ctx!.strokeStyle = grad;
          ctx!.lineWidth = 2.2;
          ctx!.lineCap = "round";
          ctx!.stroke();
          // 头部亮点（径向渐变，无 shadowBlur）
          const hg = ctx!.createRadialGradient(m.x, m.y, 0, m.x, m.y, 6);
          hg.addColorStop(0, `hsla(${m.hue}, 100%, 92%, 0.95)`);
          hg.addColorStop(1, `hsla(${m.hue}, 100%, 75%, 0)`);
          ctx!.beginPath();
          ctx!.arc(m.x, m.y, 6, 0, Math.PI * 2);
          ctx!.fillStyle = hg;
          ctx!.fill();
          if (m.life > m.max || m.x < -80 || m.x > width + 80 || m.y > height + 80) {
            meteors.splice(i, 1);
          }
        }
      }

      ctx!.globalCompositeOperation = "source-over";
    }
    raf = requestAnimationFrame(draw);

    // 页面切到后台时暂停，回到前台恢复（省电、避免卡顿累积）
    function onVisibility() {
      if (document.hidden) {
        if (running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      } else if (!running) {
        running = true;
        lastTime = 0;
        raf = requestAnimationFrame(draw);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
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
