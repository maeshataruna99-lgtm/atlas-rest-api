import { useEffect, useState } from "react";

const NAV = [
  { href: "#arsitektur", label: "Arsitektur" },
  { href: "#demo", label: "Live Demo" },
  { href: "#errors", label: "Error Handling" },
  { href: "#rbac", label: "RBAC" },
  { href: "#kode", label: "Kode & Docker" },
];

export function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5 group">
      <span className="relative w-8 h-8 grid place-items-center rounded-md border border-ok/40 bg-ok/10 transition-colors group-hover:bg-ok/20">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M2 13L8 2l6 11" stroke="var(--color-ok)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.6 9.5h6.8" stroke="var(--color-ok)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 rounded-md bg-ok/20 animate-pingdot pointer-events-none" />
      </span>
      <span className="font-display font-bold tracking-tight text-snow text-[17px]">
        atlas<span className="text-ok">/</span>api
      </span>
      <span className="font-mono text-[10px] text-faint border border-line rounded px-1.5 py-0.5 mt-0.5">
        v1.4.2
      </span>
    </a>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? Math.min(1, y / h) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-ink-950/85 backdrop-blur-md border-b border-line-soft" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="px-3 py-1.5 rounded-md text-[13.5px] font-medium text-mut hover:text-snow hover:bg-ink-700/60 transition-colors"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-mut border border-line rounded-full px-3 py-1.5">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-ok animate-pingdot" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-ok" />
            </span>
            all systems operational
          </span>
          <a
            href="#demo"
            className="font-mono text-[12px] font-semibold text-ink-950 bg-ok hover:bg-[#5fe0a6] px-4 py-2 rounded-md transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(62,207,142,0.5)]"
          >
            Coba Demo →
          </a>
        </div>
      </div>
      <div className="h-[2px] bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-ok via-cy to-info transition-[width] duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-line-soft mt-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10 justify-between">
          <div className="max-w-md">
            <Logo />
            <p className="mt-4 text-[13.5px] text-mut leading-relaxed">
              Studi arsitektur backend production-grade: pemisahan layer yang disiplin,
              error yang jujur, dan akses yang terkendali. TypeScript · Node.js · Prisma · Docker.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 font-mono text-[12.5px]">
            <div>
              <p className="text-faint text-[10.5px] tracking-[0.2em] uppercase mb-3">Navigasi</p>
              {NAV.map((n) => (
                <a key={n.href} href={n.href} className="block py-1 text-mut hover:text-ok transition-colors">
                  {n.label}
                </a>
              ))}
            </div>
            <div>
              <p className="text-faint text-[10.5px] tracking-[0.2em] uppercase mb-3">Stack</p>
              {["Node.js 20", "TypeScript 5.7", "Prisma 5", "PostgreSQL 16", "Docker Compose"].map((s) => (
                <span key={s} className="block py-1 text-mut">{s}</span>
              ))}
            </div>
            <div>
              <p className="text-faint text-[10.5px] tracking-[0.2em] uppercase mb-3">Status</p>
              <span className="block py-1 text-ok">● uptime 99.98%</span>
              <span className="block py-1 text-mut">p95 latency 38ms</span>
              <span className="block py-1 text-mut">coverage 96%</span>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-line-soft flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-[11.5px] text-faint">
            © {new Date().getFullYear()} Atlas API — proyek portofolio backend engineering
          </p>
          <p className="font-mono text-[11.5px] text-faint">
            GET <span className="text-mut">/</span> → <span className="text-ok">200 OK</span> dalam{" "}
            <span className="text-mut">38ms</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
