import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "社区刷题 | sqtk.site",
  description: "社区工作者考试刷题平台 —— 真题、模拟、错题本、刷题统计",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3478f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-slate-400">
          社区刷题 · sqtk.site · 仅供学习交流使用
        </footer>
      </body>
    </html>
  );
}
