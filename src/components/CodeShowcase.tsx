import { useState } from "react";
import { FOLDER_TREE, RUN_COMMANDS, SNIPPETS, STACK } from "../data/snippets";
import { highlightCode } from "../lib/code";
import { Reveal, SectionHead } from "./Reveal";

const TAB_ORDER = ["prisma", "dockerfile", "compose", "zod", "test", "env"];

function CopyChip({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* abaikan */
    }
  };
  return (
    <button
      onClick={copy}
      className={`shrink-0 font-mono text-[10.5px] px-2 py-1 rounded border transition-all cursor-pointer ${
        copied ? "border-ok/50 text-ok bg-ok/10" : "border-line text-faint hover:text-snow hover:border-ink-600"
      }`}
    >
      {copied ? "✓" : label ?? "salin"}
    </button>
  );
}

export function CodeShowcase() {
  const [tab, setTab] = useState("prisma");
  const snippet = SNIPPETS.find((s) => s.id === tab)!;

  return (
    <section id="kode" className="relative scroll-mt-24 py-24 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead
          index="05"
          kicker="Source of Truth"
          title={
            <>
              Kodenya beneran ada —<br />
              dari <span className="text-cy">schema.prisma</span> sampai <span className="text-info">Dockerfile</span>.
            </>
          }
          desc="Potongan yang paling sering saya jelaskan saat code review: skema database sebagai kontrak, Docker multi-stage yang kecil dan aman, validasi Zod, dan test integrasi yang menjaga RBAC tetap jujur."
        />

        <div className="mt-14 grid lg:grid-cols-[1.08fr_0.92fr] gap-6 items-start">
          {/* ---- tab + kode ---- */}
          <Reveal>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {TAB_ORDER.map((id) => {
                const s = SNIPPETS.find((x) => x.id === id)!;
                const active = id === tab;
                return (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`font-mono text-[11.5px] px-3.5 py-2 rounded-md border transition-all duration-200 cursor-pointer ${
                      active
                        ? "border-cy/50 bg-cy/10 text-cy shadow-[0_0_0_1px_rgba(95,212,224,0.15)]"
                        : "border-line text-mut hover:text-snow hover:border-ink-600"
                    }`}
                  >
                    {s.tab}
                  </button>
                );
              })}
            </div>

            <div key={tab} className="animate-riseline">
              <div className="rounded-lg border border-line bg-ink-900/90 overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-line-soft bg-ink-850">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex gap-1.5 shrink-0">
                      <i className="w-2.5 h-2.5 rounded-full bg-bad/60" />
                      <i className="w-2.5 h-2.5 rounded-full bg-warn/60" />
                      <i className="w-2.5 h-2.5 rounded-full bg-ok/60" />
                    </span>
                    <span className="font-mono text-[11px] text-mut truncate">{snippet.file}</span>
                  </div>
                  <CopyChip text={snippet.code} />
                </div>
                <div className="p-4 overflow-auto max-h-[560px]">
                  <pre className="font-mono text-[12px] leading-[1.7] text-snow/85 whitespace-pre">
                    {highlightCode(snippet.code)}
                  </pre>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ---- tree + stack + run ---- */}
          <div className="space-y-6">
            <Reveal delay={100}>
              <div className="rounded-lg border border-line bg-ink-900/90 overflow-hidden">
                <div className="px-4 py-2 border-b border-line-soft bg-ink-850">
                  <span className="font-mono text-[11px] text-mut">struktur repo — modular per domain</span>
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="font-mono text-[11px] leading-[1.75] text-mut whitespace-pre">
                    {highlightCode(FOLDER_TREE)}
                  </pre>
                </div>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="rounded-xl border border-line bg-ink-900/80 p-4">
                <p className="font-mono text-[10.5px] tracking-[0.2em] text-faint uppercase mb-3">Tech stack</p>
                <div className="grid grid-cols-2 gap-2">
                  {STACK.map((s) => (
                    <div
                      key={s.name}
                      className="group rounded-md border border-line-soft bg-ink-850/70 px-3 py-2.5 hover:border-cy/40 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <p className="font-display font-semibold text-[13px] text-snow/90 group-hover:text-cy transition-colors">
                        {s.name}
                      </p>
                      <p className="font-mono text-[10px] text-faint mt-0.5">{s.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={220}>
              <div className="rounded-xl border border-ok/25 bg-ok/[0.04] p-4">
                <p className="font-mono text-[10.5px] tracking-[0.2em] text-ok uppercase mb-3">
                  ▸ Jalankan lokal — 5 perintah
                </p>
                <ol className="space-y-2.5">
                  {RUN_COMMANDS.map((c) => (
                    <li key={c.step} className="group">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10.5px] text-faint shrink-0">{c.step}</span>
                        <span className="text-[12px] text-mut">{c.note}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 rounded-md border border-line bg-ink-950/80 pl-3 pr-2 py-2 hover:border-ok/40 transition-colors">
                        <code className="font-mono text-[11px] text-snow/85 truncate flex-1">
                          <span className="text-ok mr-1.5">$</span>
                          {c.cmd}
                        </code>
                        <CopyChip text={c.cmd} />
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
