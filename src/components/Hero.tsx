import { useEffect, useState, type CSSProperties } from "react";
import { ENDPOINTS } from "../data/api";
import { highlightCode } from "../lib/code";

/* ---------- terminal animasi ---------- */

type TermLine = { type: "cmd" | "ok" | "bad" | "json" | "dim"; text: string };

const LINES: TermLine[] = [
  {
    type: "cmd",
    text: 'curl -s -X POST https://api.atlas.dev/api/v1/auth/login -d \'{"email":"manager@atlas.dev"}\'',
  },
  { type: "ok", text: "HTTP/2 200 OK · 42ms · application/json" },
  {
    type: "json",
    text: '{ "success": true, "data": { "tokenType": "Bearer", "expiresIn": 3600, "role": "manager" } }',
  },
  {
    type: "cmd",
    text: 'curl -s -X PATCH .../api/v1/orders/ord_1042/status -H "Authorization: Bearer eyJhbG…"',
  },
  { type: "ok", text: "HTTP/2 200 OK · 31ms · state: PENDING → CONFIRMED" },
  {
    type: "cmd",
    text: '# coba lagi dengan token role staff…',
  },
  { type: "bad", text: "HTTP/2 403 Forbidden · 8ms · code=FORBIDDEN" },
  {
    type: "json",
    text: '{ "success": false, "error": { "code": "FORBIDDEN", "message": "Role \'staff\' tidak punya permission \'orders:update-status\'" } }',
  },
];

function Terminal() {
  const [pos, setPos] = useState({ count: 0, chars: 0 });

  useEffect(() => {
    let alive = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      while (alive) {
        for (let i = 0; i <= LINES.length; i++) {
          if (!alive) return;
          setPos({ count: i, chars: 0 });
          const prev = i > 0 ? LINES[i - 1] : null;
          if (prev && prev.type === "cmd") {
            for (let c = 1; c <= prev.text.length; c++) {
              if (!alive) return;
              setPos({ count: i, chars: c });
              await sleep(prev.text.startsWith("#") ? 26 : 13);
            }
            await sleep(420);
          } else {
            await sleep(i === 0 ? 700 : 300);
          }
        }
        await sleep(3600);
        if (!alive) return;
        setPos({ count: 0, chars: 0 });
        await sleep(500);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const visible = LINES.slice(0, pos.count);
  const typing = pos.count > 0 && pos.count <= LINES.length ? LINES[pos.count - 1] : null;

  return (
    <div className="relative rounded-xl border border-line bg-ink-900/95 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] overflow-hidden terminal-scan">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line-soft bg-ink-850">
        <span className="flex gap-1.5">
          <i className="w-3 h-3 rounded-full bg-bad/70" />
          <i className="w-3 h-3 rounded-full bg-warn/70" />
          <i className="w-3 h-3 rounded-full bg-ok/70" />
        </span>
        <span className="ml-2 font-mono text-[11px] text-mut">atlas@prod: ~ — zsh</span>
        <span className="ml-auto font-mono text-[10px] text-faint border border-line rounded px-2 py-0.5">
          TLS 1.3
        </span>
      </div>
      <div className="p-4 sm:p-5 font-mono text-[12px] sm:text-[12.5px] leading-[1.85] min-h-[318px]">
        {visible.map((l, i) => (
          <TermLineView key={i} line={l} full />
        ))}
        {typing && typing.type === "cmd" && (
          <TermLineView line={{ ...typing, text: typing.text.slice(0, pos.chars) }} typing />
        )}
        {pos.count === 0 && <span className="text-ok">$</span>}
        <span className="inline-block w-[8px] h-[15px] bg-ok/90 align-middle ml-1 animate-blink" />
      </div>
    </div>
  );
}

function TermLineView({ line, full, typing }: { line: TermLine; full?: boolean; typing?: boolean }) {
  if (line.type === "cmd") {
    return (
      <p className={typing ? "" : "animate-riseline"}>
        <span className="text-ok mr-2">{line.text.startsWith("#") ? "#" : "$"}</span>
        <span className="text-snow/90">{line.text.startsWith("#") ? line.text.slice(2) : line.text}</span>
      </p>
    );
  }
  if (line.type === "ok")
    return (
      <p className="text-ok/90 animate-riseline pl-5">
        <span className="opacity-60 mr-1">↳</span>
        {line.text}
      </p>
    );
  if (line.type === "bad")
    return (
      <p className="text-bad animate-riseline pl-5">
        <span className="opacity-60 mr-1">↳</span>
        {line.text}
      </p>
    );
  return (
    <div className={`text-mut pl-5 pb-2 ${full ? "animate-riseline" : ""}`}>
      <pre className="whitespace-pre-wrap break-words font-mono">{highlightCode(line.text)}</pre>
    </div>
  );
}

/* ---------- marquee endpoint ---------- */

const METHOD_COLOR: Record<string, string> = {
  GET: "text-ok border-ok/40 bg-ok/10",
  POST: "text-info border-info/40 bg-info/10",
  PATCH: "text-warn border-warn/40 bg-warn/10",
  DELETE: "text-bad border-bad/40 bg-bad/10",
};

export function MethodBadge({ method, className = "" }: { method: string; className?: string }) {
  return (
    <span
      className={`inline-block font-mono text-[10.5px] font-semibold tracking-wide px-1.5 py-0.5 rounded border ${
        METHOD_COLOR[method] ?? "text-mut border-line"
      } ${className}`}
    >
      {method}
    </span>
  );
}

function EndpointMarquee() {
  const items = ENDPOINTS.map((e) => (
    <span key={e.id} className="flex items-center gap-2.5 shrink-0">
      <MethodBadge method={e.method} />
      <span className="text-mut">{e.path}</span>
      <span className="text-line mx-3">/</span>
    </span>
  ));
  return (
    <div className="relative mt-16 border-y border-line-soft py-3.5 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className="flex gap-2 w-max animate-marquee font-mono text-[12px]">
        {items}
        <span aria-hidden className="contents">
          {items}
        </span>
      </div>
    </div>
  );
}

/* ---------- hero ---------- */

const STATS = [
  { value: "24", label: "endpoint REST" },
  { value: "4", label: "role RBAC" },
  { value: "96%", label: "test coverage" },
  { value: "38ms", label: "p95 latency" },
];

const CHIPS = ["TypeScript strict", "Node.js 20", "Prisma 5 + PostgreSQL", "Docker Compose", "Zod validation", "JWT + bcrypt"];

export function Hero() {
  return (
    <section id="top" className="relative pt-28 sm:pt-36">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-12 lg:gap-10 items-center">
          <div>
            <p className="font-mono text-[11.5px] tracking-[0.3em] text-ok mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-ok/60" />
              PORTFOLIO · BACKEND ENGINEERING
            </p>
            <h1 className="font-display font-bold tracking-tight text-snow leading-[1.04] text-[2.6rem] sm:text-6xl xl:text-[4.2rem]">
              <span className="mask-line">
                <span style={{ "--ml-delay": "60ms" } as CSSProperties}>Enterprise REST API</span>
              </span>
              <span className="mask-line text-mut">
                <span style={{ "--ml-delay": "180ms" } as CSSProperties}>yang tiap layernya</span>
              </span>
              <span className="mask-line">
                <span style={{ "--ml-delay": "300ms" } as CSSProperties}>
                  bisa <span className="text-ok">diaudit.</span>
                </span>
              </span>
            </h1>
            <p className="mt-6 text-mut text-[15.5px] leading-relaxed max-w-xl">
              <span className="text-snow font-semibold">Atlas API</span> — order management API dengan
              pola <span className="font-mono text-[13.5px] text-cy">Controller → Service → Repository</span>,
              RBAC berbasis JWT, error envelope yang konsisten, dan validasi Zod di batas sistem.
              Demo interaktifnya bisa kamu tembak langsung dari halaman ini.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {CHIPS.map((c) => (
                <span
                  key={c}
                  className="font-mono text-[11px] text-mut border border-line rounded-full px-3 py-1.5 hover:border-ok/50 hover:text-snow transition-colors cursor-default"
                >
                  {c}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#demo"
                className="group font-mono text-[13px] font-semibold text-ink-950 bg-ok hover:bg-[#5fe0a6] px-6 py-3.5 rounded-md transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-10px_rgba(62,207,142,0.55)]"
              >
                ▶ Coba live demo
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
              </a>
              <a
                href="#arsitektur"
                className="font-mono text-[13px] text-snow border border-ink-600 hover:border-ok/60 hover:text-ok px-6 py-3.5 rounded-md transition-all hover:-translate-y-0.5"
              >
                Bedah arsitektur ↓
              </a>
            </div>

            <dl className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line-soft border border-line-soft rounded-lg overflow-hidden">
              {STATS.map((s, i) => (
                <div key={s.label} className="bg-ink-900/80 px-4 py-4 group hover:bg-ink-800 transition-colors">
                  <dt className="font-mono text-[10.5px] tracking-[0.14em] text-faint uppercase">{s.label}</dt>
                  <dd
                    className={`font-display font-bold text-[1.7rem] leading-tight mt-1 transition-colors ${
                      ["text-ok", "text-info", "text-warn", "text-cy"][i % 4]
                    } group-hover:text-snow`}
                  >
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 bg-[radial-gradient(ellipse_at_top_right,rgba(62,207,142,0.09),transparent_60%)] pointer-events-none" />
            <Terminal />
            <div className="hidden sm:flex absolute -left-7 top-16 animate-riseline items-center gap-2.5 rounded-lg border border-line bg-ink-850/95 backdrop-blur px-3.5 py-2.5 shadow-xl [animation-delay:600ms]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <rect x="2" y="7" width="12" height="7" rx="1.5" stroke="var(--color-warn)" strokeWidth="1.5" />
                <path d="M5 7V5a3 3 0 016 0v2" stroke="var(--color-warn)" strokeWidth="1.5" />
              </svg>
              <span className="font-mono text-[11px] text-mut">
                JWT verified · <span className="text-warn">role=manager</span>
              </span>
            </div>
            <div className="hidden sm:flex absolute -right-5 -bottom-5 animate-riseline items-center gap-2.5 rounded-lg border border-line bg-ink-850/95 backdrop-blur px-3.5 py-2.5 shadow-xl [animation-delay:900ms]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M8 1.5l5.5 2.5v4c0 3.5-2.5 5.5-5.5 6.5-3-1-5.5-3-5.5-6.5V4L8 1.5z" stroke="var(--color-ok)" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M5.5 8l1.8 1.8L10.5 6" stroke="var(--color-ok)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-mono text-[11px] text-mut">
                rbac.guard · <span className="text-ok">permission ✓</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <EndpointMarquee />
    </section>
  );
}
