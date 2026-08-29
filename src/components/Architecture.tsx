import { useState } from "react";
import { ARCH_LAYERS } from "../data/snippets";
import { CodeBlock } from "../lib/code";
import { Reveal, SectionHead } from "./Reveal";

const PRINCIPLES = [
  {
    n: "01",
    title: "Satu arah ketergantungan",
    desc: "Controller boleh tahu Service; Service boleh tahu Repository; kebalikannya tidak pernah. HTTP tidak pernah bocor ke domain.",
  },
  {
    n: "02",
    title: "Error sebagai data",
    desc: "Service melempar NotFoundError / ConflictError — bukan mengembalikan { error: true }. errorHandler global menerjemahkannya jadi satu format JSON.",
  },
  {
    n: "03",
    title: "Testable tanpa Docker",
    desc: "Service menerima interface repository, jadi unit test berjalan dengan fake in-memory dalam milidetik — database hanya dibutuhkan test integrasi.",
  },
];

export function Architecture() {
  const [active, setActive] = useState(1); // mulai dari Controller — bintang utamanya
  const layer = ARCH_LAYERS[active];

  return (
    <section id="arsitektur" className="relative scroll-mt-24 py-24 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead
          index="01"
          kicker="Clean Architecture"
          title={
            <>
              Request mengalir satu arah:
              <br />
              <span className="text-info">Controller</span> → <span className="text-warn">Service</span> →{" "}
              <span className="text-ok">Repository</span>
            </>
          }
          desc="Setiap layer punya satu tanggung jawab dan satu alasan untuk berubah. Klik setiap layer untuk melihat potongan implementasi aslinya — ini bukan diagram hiasan, ini kontrak kerja."
        />

        <div className="mt-14 grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
          {/* ---- pipeline interaktif ---- */}
          <Reveal>
            <div className="rounded-xl border border-line bg-ink-900/70 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[11px] tracking-[0.2em] text-faint uppercase">Alur request</span>
                <span className="font-mono text-[11px] text-mut">
                  <span className="text-info">▼ request</span> · <span className="text-ok">▲ response</span>
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] text-faint mb-3 pl-1">
                <span className="w-2 h-2 rounded-full bg-info/70" /> HTTP request + Bearer token
              </div>

              <div className="relative">
                {/* garis aliran */}
                <svg
                  className="absolute left-[22px] top-2 bottom-2 w-[3px] text-info/50"
                  preserveAspectRatio="none"
                  viewBox="0 0 3 100"
                  aria-hidden
                >
                  <line
                    x1="1.5"
                    y1="0"
                    x2="1.5"
                    y2="100"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 8"
                    className="animate-dashflow"
                  />
                </svg>

                <ol className="space-y-2.5 relative">
                  {ARCH_LAYERS.map((l, i) => {
                    const isActive = i === active;
                    return (
                      <li key={l.id}>
                        <button
                          onClick={() => setActive(i)}
                          className={`w-full text-left flex items-start gap-4 rounded-lg border px-3.5 py-3.5 transition-all duration-300 cursor-pointer group ${
                            isActive
                              ? "border-ok/60 bg-ok/[0.07] shadow-[0_0_0_1px_rgba(62,207,142,0.25),0_10px_30px_-14px_rgba(62,207,142,0.4)] translate-x-1"
                              : "border-line bg-ink-850/60 hover:border-ink-600 hover:translate-x-1"
                          }`}
                        >
                          <span
                            className={`relative z-10 shrink-0 w-9 h-9 grid place-items-center rounded-md font-mono text-[12px] font-bold border transition-colors ${
                              isActive ? "bg-ok text-ink-950 border-ok" : "bg-ink-800 text-mut border-line group-hover:text-snow"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-baseline gap-x-2.5">
                              <span className={`font-display font-semibold text-[15.5px] ${isActive ? "text-snow" : "text-snow/85"}`}>
                                {l.name}
                              </span>
                              <span className="font-mono text-[10.5px] text-faint truncate">{l.file}</span>
                            </span>
                            <span className="block mt-1 text-[12.5px] leading-snug text-mut">{l.role}</span>
                          </span>
                          <span
                            className={`ml-auto shrink-0 self-center font-mono text-[10px] px-2 py-1 rounded border transition-colors ${
                              isActive ? "text-ok border-ok/40 bg-ok/10" : "text-faint border-line"
                            }`}
                          >
                            {isActive ? "aktif" : "lihat →"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] text-faint mt-3 pl-1">
                <span className="w-2 h-2 rounded-full bg-cy/70" /> PostgreSQL 16 · satu-satunya state yang bertahan
              </div>
            </div>
          </Reveal>

          {/* ---- kode layer aktif ---- */}
          <Reveal delay={120}>
            <div key={layer.id} className="animate-riseline">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[11px] tracking-[0.2em] text-faint uppercase">
                  Implementasi · <span className="text-ok normal-case">{layer.name}</span>
                </p>
                <div className="flex gap-1.5">
                  {ARCH_LAYERS.map((_, i) => (
                    <button
                      key={i}
                      aria-label={`Layer ${i + 1}`}
                      onClick={() => setActive(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        i === active ? "w-6 bg-ok" : "w-2.5 bg-ink-600 hover:bg-mut"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <CodeBlock code={layer.code} file={layer.file} maxH="430px" />
              <ul className="mt-4 space-y-2">
                {layer.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[13px] text-mut leading-relaxed">
                    <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M2.5 7.5l3 3 6-7" stroke="var(--color-ok)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* prinsip */}
        <div className="mt-16 rounded-xl border border-line bg-ink-900/60 overflow-hidden">
          {PRINCIPLES.map((p, i) => (
            <Reveal
              key={p.n}
              delay={i * 90}
              className={`group grid sm:grid-cols-[90px_260px_1fr] gap-2 sm:gap-6 px-6 py-5 transition-colors hover:bg-ink-800/70 ${
                i > 0 ? "border-t border-line-soft" : ""
              }`}
            >
              <span className="font-mono text-[13px] text-faint group-hover:text-ok transition-colors">/{p.n}</span>
              <h3 className="font-display font-semibold text-[16px] text-snow">{p.title}</h3>
              <p className="text-[13.5px] text-mut leading-relaxed">{p.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
