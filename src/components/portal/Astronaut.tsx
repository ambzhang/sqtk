"use client";

import Image from "next/image";

/**
 * 漂浮宇航员背景装饰（写实 3D 渲染图，透明背景 PNG）
 * - 失重漂浮：缓慢上下位移 + 轻微旋转（CSS，GPU 加速）
 * - 柔光光晕衬底，融入深空氛围
 * 放在星空层之上、内容层之下（z-[1]），pointer-events-none 不挡交互。
 */
export default function Astronaut() {
  return (
    <div
      aria-hidden="true"
      className="astro-wrap pointer-events-none fixed right-[4%] top-[13%] z-[1] hidden w-[clamp(220px,24vw,400px)] md:block"
    >
      <div className="astro-float relative">
        {/* 柔光光晕，让宇航员更好地融入背景 */}
        <div className="absolute left-1/2 top-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(120,140,255,0.22),transparent_65%)] blur-2xl" />
        <Image
          src="/astronaut.png"
          alt=""
          width={512}
          height={768}
          priority
          className="h-auto w-full select-none drop-shadow-[0_24px_60px_rgba(90,130,255,0.35)]"
        />
      </div>
    </div>
  );
}
