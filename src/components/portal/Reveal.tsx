"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 进入视口时触发淡入上浮动画的包裹组件。
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: keyof JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setShown(true), delay);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  const Comp = Tag as any;
  return (
    <Comp
      ref={ref}
      className={`reveal ${shown ? "in" : ""} ${className}`}
    >
      {children}
    </Comp>
  );
}
