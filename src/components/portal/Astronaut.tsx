"use client";

/**
 * 漂浮宇航员背景装饰（纯 SVG + CSS 动画，天生透明背景，零外部依赖）
 * 动画分层：
 * - 整体失重漂浮：上下浮动 + 轻微旋转（astro-float）
 * - 手臂 / 腿：划水式轻摆（limb-*）
 * - 系绳：随风飘动（tether-sway）
 * - 面罩：流光扫过（visor-shine）
 * - 推进器：喷气脉冲（thruster）
 * - 环绕星尘：闪烁（star-twinkle）
 * z-[1]：星空层之上、内容层之下；pointer-events-none 不挡交互。
 */
export default function Astronaut() {
  return (
    <div
      aria-hidden="true"
      className="astro-wrap pointer-events-none fixed right-[5%] top-[14%] z-[1] hidden w-[clamp(200px,20vw,340px)] md:block"
    >
      {/* 柔光光晕衬底 */}
      <div className="astro-float relative">
        <div className="absolute left-1/2 top-1/2 -z-10 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(120,150,255,0.20),transparent_62%)] blur-2xl" />

        <svg
          viewBox="0 0 300 340"
          className="h-auto w-full select-none drop-shadow-[0_22px_55px_rgba(90,130,255,0.38)]"
          fill="none"
        >
          <defs>
            {/* 头盔玻璃渐变 */}
            <radialGradient id="a-visor" cx="42%" cy="34%" r="72%">
              <stop offset="0%" stopColor="#7fd4ff" />
              <stop offset="38%" stopColor="#3b5bdb" />
              <stop offset="100%" stopColor="#0b1233" />
            </radialGradient>
            {/* 头盔外壳 */}
            <linearGradient id="a-helmet" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#e4ebf5" />
              <stop offset="100%" stopColor="#b7c2d6" />
            </linearGradient>
            {/* 宇航服主体 */}
            <linearGradient id="a-suit" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f3f6fb" />
              <stop offset="60%" stopColor="#dbe3ef" />
              <stop offset="100%" stopColor="#aeb9cc" />
            </linearGradient>
            {/* 关节/手套阴影 */}
            <linearGradient id="a-limb" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e8edf6" />
              <stop offset="100%" stopColor="#9aa6bd" />
            </linearGradient>
            {/* 推进器火焰 */}
            <linearGradient id="a-thrust" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a8e9ff" />
              <stop offset="55%" stopColor="#5aa2ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#5aa2ff" stopOpacity="0" />
            </linearGradient>
            {/* 面罩流光 */}
            <linearGradient id="a-shine" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="a-visor-clip">
              <ellipse cx="150" cy="88" rx="46" ry="50" />
            </clipPath>
          </defs>

          {/* ===== 推进器喷气（最底层） ===== */}
          <g className="thruster" style={{ transformOrigin: "150px 250px" }}>
            <ellipse cx="150" cy="262" rx="20" ry="42" fill="url(#a-thrust)" />
            <ellipse cx="150" cy="256" rx="10" ry="26" fill="#cdeeff" opacity="0.7" />
          </g>

          {/* ===== 系绳 ===== */}
          <path
            className="tether-sway"
            d="M96 150 C 40 175, 20 235, 8 300"
            stroke="#8fa6d8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="1 9"
            opacity="0.7"
            style={{ transformOrigin: "96px 150px" }}
          />

          {/* ===== 左臂（划水轻摆） ===== */}
          <g className="limb-l" style={{ transformOrigin: "108px 150px" }}>
            <rect x="78" y="146" width="42" height="26" rx="13" fill="url(#a-suit)" />
            <circle cx="80" cy="159" r="15" fill="url(#a-limb)" />
          </g>

          {/* ===== 右臂 ===== */}
          <g className="limb-r" style={{ transformOrigin: "192px 150px" }}>
            <rect x="180" y="146" width="44" height="26" rx="13" fill="url(#a-suit)" />
            <circle cx="222" cy="159" r="15" fill="url(#a-limb)" />
          </g>

          {/* ===== 左腿 ===== */}
          <g className="leg-l" style={{ transformOrigin: "132px 220px" }}>
            <rect x="120" y="214" width="26" height="56" rx="13" fill="url(#a-suit)" />
            <ellipse cx="133" cy="272" rx="17" ry="13" fill="url(#a-limb)" />
          </g>

          {/* ===== 右腿 ===== */}
          <g className="leg-r" style={{ transformOrigin: "168px 220px" }}>
            <rect x="154" y="214" width="26" height="56" rx="13" fill="url(#a-suit)" />
            <ellipse cx="167" cy="272" rx="17" ry="13" fill="url(#a-limb)" />
          </g>

          {/* ===== 身体 ===== */}
          <rect x="112" y="140" width="76" height="90" rx="34" fill="url(#a-suit)" />
          {/* 胸口控制面板 */}
          <rect x="132" y="168" width="36" height="26" rx="6" fill="#1a2340" />
          <circle cx="141" cy="176" r="3" fill="#ff6b81" />
          <circle cx="151" cy="176" r="3" fill="#ffd166" />
          <circle cx="161" cy="176" r="3" fill="#4dd4ac" />
          <rect x="138" y="184" width="24" height="4" rx="2" fill="#3b5bdb" />

          {/* ===== 头盔 ===== */}
          <circle cx="150" cy="88" r="56" fill="url(#a-helmet)" />
          {/* 面罩玻璃 */}
          <ellipse cx="150" cy="88" rx="46" ry="50" fill="url(#a-visor)" />
          {/* 面罩内流光 */}
          <g clipPath="url(#a-visor-clip)">
            <rect className="visor-shine" x="100" y="30" width="26" height="120" fill="url(#a-shine)" />
          </g>
          {/* 面罩高光点 */}
          <ellipse cx="132" cy="70" rx="12" ry="16" fill="#ffffff" opacity="0.45" />
          <circle cx="168" cy="105" r="5" fill="#bfe3ff" opacity="0.6" />
          {/* 金色面罩边框 */}
          <ellipse cx="150" cy="88" rx="46" ry="50" fill="none" stroke="#ffcf6b" strokeWidth="3" opacity="0.85" />

          {/* ===== 环绕星尘 ===== */}
          <g fill="#ffffff">
            <circle className="star-twinkle" cx="250" cy="70" r="2.5" style={{ animationDelay: "0s" }} />
            <circle className="star-twinkle" cx="40" cy="110" r="2" style={{ animationDelay: "0.6s" }} />
            <circle className="star-twinkle" cx="260" cy="200" r="1.8" style={{ animationDelay: "1.1s" }} />
            <circle className="star-twinkle" cx="235" cy="300" r="2.2" style={{ animationDelay: "1.6s" }} />
            <circle className="star-twinkle" cx="60" cy="255" r="1.6" style={{ animationDelay: "0.3s" }} />
          </g>
        </svg>
      </div>
    </div>
  );
}
