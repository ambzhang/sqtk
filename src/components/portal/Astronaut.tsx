"use client";

/**
 * 漂浮宇航员背景装饰（纯 SVG + CSS 动画，几乎零性能开销）
 * - 失重漂浮：缓慢上下浮动 + 轻微旋转
 * - 头盔面罩带星空反光渐变
 * - 系绳随宇航员轻摆
 * 放在星空层之上、内容层之下（z-[1]），pointer-events-none 不挡交互。
 */
export default function Astronaut() {
  return (
    <div
      aria-hidden="true"
      className="astro-wrap pointer-events-none fixed right-[6%] top-[16%] z-[1] hidden w-[clamp(200px,22vw,360px)] md:block"
    >
      <div className="astro-float">
        <svg viewBox="0 0 260 320" className="h-auto w-full drop-shadow-[0_20px_40px_rgba(80,120,255,0.25)]">
          <defs>
            {/* 头盔面罩星空反光 */}
            <radialGradient id="visor" cx="38%" cy="32%" r="75%">
              <stop offset="0%" stopColor="#8ab4ff" stopOpacity="0.95" />
              <stop offset="42%" stopColor="#2b3b73" />
              <stop offset="100%" stopColor="#0a1030" />
            </radialGradient>
            {/* 白色宇航服渐变 */}
            <linearGradient id="suit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#e6ecfb" />
              <stop offset="100%" stopColor="#b9c6e6" />
            </linearGradient>
            <linearGradient id="suitShade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c3cee9" />
              <stop offset="100%" stopColor="#eef2fc" />
            </linearGradient>
            {/* 头盔外壳 */}
            <linearGradient id="helmet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#c8d3ee" />
            </linearGradient>
            <linearGradient id="tether" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#c4b5fd" />
            </linearGradient>
          </defs>

          {/* 系绳 */}
          <path
            className="astro-tether"
            d="M40 6 C 70 60, 60 120, 96 150"
            fill="none"
            stroke="url(#tether)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />

          <g className="astro-body">
            {/* 左臂 */}
            <rect x="60" y="150" width="34" height="72" rx="17" fill="url(#suit)" transform="rotate(24 77 186)" />
            <rect x="58" y="205" width="28" height="28" rx="13" fill="url(#suitShade)" transform="rotate(24 72 219)" />
            {/* 右臂 */}
            <rect x="168" y="150" width="34" height="72" rx="17" fill="url(#suit)" transform="rotate(-18 185 186)" />
            <rect x="176" y="205" width="28" height="28" rx="13" fill="url(#suitShade)" transform="rotate(-18 190 219)" />

            {/* 双腿 */}
            <rect x="98" y="228" width="30" height="70" rx="15" fill="url(#suit)" transform="rotate(8 113 263)" />
            <rect x="132" y="228" width="30" height="70" rx="15" fill="url(#suit)" transform="rotate(-8 147 263)" />
            <rect x="96" y="286" width="34" height="24" rx="10" fill="url(#suitShade)" transform="rotate(8 113 298)" />
            <rect x="130" y="286" width="34" height="24" rx="10" fill="url(#suitShade)" transform="rotate(-8 147 298)" />

            {/* 躯干 */}
            <rect x="86" y="150" width="88" height="96" rx="34" fill="url(#suit)" />
            {/* 胸口控制面板 */}
            <rect x="108" y="176" width="44" height="34" rx="8" fill="#2b3b73" opacity="0.85" />
            <circle cx="120" cy="188" r="4" fill="#7dd3fc" />
            <circle cx="134" cy="188" r="4" fill="#f0abfc" />
            <rect x="114" y="198" width="32" height="4" rx="2" fill="#8ab4ff" opacity="0.8" />

            {/* 头盔 */}
            <circle cx="130" cy="112" r="56" fill="url(#helmet)" />
            {/* 面罩 */}
            <circle cx="130" cy="112" r="42" fill="url(#visor)" />
            {/* 面罩高光 */}
            <ellipse cx="116" cy="96" rx="16" ry="11" fill="#ffffff" opacity="0.35" />
            <circle cx="150" cy="128" r="4" fill="#ffffff" opacity="0.5" />
            <circle cx="142" cy="118" r="2" fill="#ffffff" opacity="0.7" />

            {/* 头盔顶灯与两侧扣 */}
            <rect x="122" y="52" width="16" height="8" rx="4" fill="#c4b5fd" />
            <circle cx="76" cy="112" r="7" fill="#c8d3ee" />
            <circle cx="184" cy="112" r="7" fill="#c8d3ee" />
          </g>
        </svg>
      </div>
    </div>
  );
}
