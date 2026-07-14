import Navbar from "@/components/Navbar";

export default function ShuatiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-slate-400">
        社区刷题 · sqtk.site · 仅供学习交流使用
        <span className="mx-2">·</span>
        <a href="/" className="hover:text-brand-500">返回主站</a>
      </footer>
    </>
  );
}
