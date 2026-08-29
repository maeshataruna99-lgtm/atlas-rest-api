import { useState } from "react";
import { Navbar, Footer } from "./components/Chrome";
import { Hero } from "./components/Hero";
import { Architecture } from "./components/Architecture";
import { Playground } from "./components/Playground";
import { ErrorsSection, RbacSection } from "./components/ErrorsRbac";
import { CodeShowcase } from "./components/CodeShowcase";
import { Reveal } from "./components/Reveal";

function ClosingBand() {
  const [copied, setCopied] = useState(false);
  const cmd = "git clone https://github.com/username/atlas-api.git && cd atlas-api && docker compose up -d --build";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* abaikan */
    }
  };

  return (
    <section className="relative py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-line bg-ink-900/80 px-7 sm:px-12 py-12 sm:py-16">
            <div className="absolute inset-0 bg-blueprint-flat opacity-70 pointer-events-none" />
            <div className="absolute -right-24 -top-24 w-80 h-80 bg-[radial-gradient(circle,rgba(62,207,142,0.1),transparent_70%)] pointer-events-none" />
            <div className="relative grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
              <div>
                <p className="font-mono text-[11.5px] tracking-[0.3em] text-ok mb-4">PENUTUP · 204 NO CONTENT</p>
                <h2 className="font-display font-bold tracking-tight text-snow text-3xl sm:text-[2.6rem] leading-[1.08]">
                  Selesai membaca?
                  <br />
                  Sekarang <span className="text-ok">coba rusakkan.</span>
                </h2>
                <p className="mt-4 text-mut text-[15px] leading-relaxed max-w-lg">
                  Kirim body invalid, pakai id fiktif, tembak endpoint admin dengan token staff —
                  demo di atas dirancang untuk gagal dengan anggun, persis seperti API aslinya.
                </p>
                <div className="mt-7 flex flex-wrap gap-4">
                  <a
                    href="#demo"
                    className="font-mono text-[13px] font-semibold text-ink-950 bg-ok hover:bg-[#5fe0a6] px-6 py-3.5 rounded-md transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-10px_rgba(62,207,142,0.55)]"
                  >
                    ↑ Kembali ke demo
                  </a>
                  <button
                    onClick={copy}
                    className={`font-mono text-[13px] px-6 py-3.5 rounded-md border transition-all cursor-pointer hover:-translate-y-0.5 ${
                      copied ? "border-ok/60 text-ok bg-ok/10" : "border-ink-600 text-snow hover:border-ok/60 hover:text-ok"
                    }`}
                  >
                    {copied ? "✓ perintah tersalin" : "$ salin docker compose up"}
                  </button>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="rounded-xl border border-line bg-ink-950/80 p-5 font-mono text-[12px] leading-[2]">
                  <p><span className="text-faint">$</span> <span className="text-snow/90">curl -s localhost:3000/health</span></p>
                  <p className="text-ok">{"{"} "status": "healthy", "uptime": "21d 4h", <span className="text-snow/70">…</span> {"}"}</p>
                  <p className="text-faint mt-3"># lapisan boleh banyak,</p>
                  <p className="text-faint"># alasan untuk rapuh cuma nol.</p>
                  <span className="inline-block w-[8px] h-[14px] bg-ok/90 animate-blink mt-2" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="relative min-h-screen">
      {/* latar ambient berlapis */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-blueprint" />
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[950px] h-[540px] bg-[radial-gradient(ellipse_at_center,rgba(62,207,142,0.075),transparent_65%)]" />
        <div className="absolute top-[36%] -left-48 w-[560px] h-[560px] bg-[radial-gradient(circle,rgba(88,182,245,0.055),transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[620px] h-[420px] bg-[radial-gradient(ellipse_at_bottom_right,rgba(95,212,224,0.05),transparent_70%)]" />
      </div>

      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Architecture />
        <Playground />
        <ErrorsSection />
        <RbacSection />
        <CodeShowcase />
        <ClosingBand />
      </main>
      <Footer />
    </div>
  );
}
