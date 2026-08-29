import { useEffect, useMemo, useRef, useState } from "react";
import {
  ENDPOINTS,
  TOKENS,
  simulate,
  type EndpointDef,
  type RoleToken,
  type SimResult,
  type TraceStep,
} from "../data/api";
import { JsonView } from "../lib/code";
import { Reveal, SectionHead } from "./Reveal";
import { MethodBadge } from "./Hero";

/* ---------- helper ---------- */

const LAYER_META: Record<TraceStep["layer"], { label: string; cls: string }> = {
  gateway: { label: "GATEWAY", cls: "text-mut border-line bg-ink-700/40" },
  middleware: { label: "MIDDLEWARE", cls: "text-warn border-warn/40 bg-warn/10" },
  controller: { label: "CONTROLLER", cls: "text-info border-info/40 bg-info/10" },
  service: { label: "SERVICE", cls: "text-cy border-cy/40 bg-cy/10" },
  repository: { label: "REPOSITORY", cls: "text-ok border-ok/40 bg-ok/10" },
};

const statusColor = (s: number) =>
  s < 300 ? "text-ok border-ok/50 bg-ok/10" : s < 500 ? "text-warn border-warn/50 bg-warn/10" : "text-bad border-bad/50 bg-bad/10";

const RATE_MAX = 6;
const RATE_WINDOW = 10_000;

interface HistoryItem {
  defId: string;
  method: string;
  path: string;
  status: number;
  param: string;
  body: string;
}

interface Scenario {
  label: string;
  kind: "param" | "body";
  value: string;
}

const SCENARIOS: Record<string, Scenario[]> = {
  "get-order": [
    { label: "id valid → 200", kind: "param", value: "ord_1042" },
    { label: "id tak dikenal → 404", kind: "param", value: "ord_9999" },
    { label: "id kosong → 404 route", kind: "param", value: " " },
  ],
  "create-order": [
    { label: "body valid → 201", kind: "body", value: "{\n  \"customerId\": \"cus_01\",\n  \"items\": [\n    { \"sku\": \"KEY-MX87\", \"qty\": 2 },\n    { \"sku\": \"SSD-1TB\", \"qty\": 1 }\n  ]\n}" },
    { label: "qty = 0 → 422", kind: "body", value: "{\n  \"customerId\": \"cus_02\",\n  \"items\": [\n    { \"sku\": \"MON-27Q\", \"qty\": 0 }\n  ]\n}" },
    { label: "SKU fiktif → 422", kind: "body", value: "{\n  \"customerId\": \"cus_01\",\n  \"items\": [\n    { \"sku\": \"ROKET-01\", \"qty\": 3 }\n  ]\n}" },
    { label: "JSON rusak → 400", kind: "body", value: "{ customerId: cus_01,, }" },
  ],
  "update-status": [
    { label: "pending → confirmed ✓", kind: "body", value: "{\n  \"status\": \"confirmed\"\n}" },
    { label: "lompat ke delivered → 409", kind: "body", value: "{\n  \"status\": \"delivered\"\n}" },
    { label: "enum ngawur → 422", kind: "body", value: "{\n  \"status\": \"meledak\"\n}" },
    { label: "order tak ada → 404", kind: "param", value: "ord_0000" },
  ],
  login: [
    { label: "kredensial benar → 200", kind: "body", value: "{\n  \"email\": \"manager@atlas.dev\",\n  \"password\": \"manager123\"\n}" },
    { label: "password salah → 401", kind: "body", value: "{\n  \"email\": \"manager@atlas.dev\",\n  \"password\": \"salah-dong\"\n}" },
    { label: "field kosong → 422", kind: "body", value: "{\n  \"email\": \"\",\n  \"password\": \"\"\n}" },
  ],
  "delete-user": [
    { label: "hapus usr_04 → 204", kind: "param", value: "usr_04" },
    { label: "hapus diri sendiri → 409", kind: "param", value: "usr_01" },
    { label: "user fiktif → 404", kind: "param", value: "usr_99" },
  ],
};

function rateLimitedResult(): SimResult {
  const body = {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Terlalu banyak request. Coba lagi dalam 10 detik.",
      requestId: "req_" + Math.random().toString(36).slice(2, 10),
      timestamp: new Date().toISOString(),
    },
  };
  return {
    status: 429,
    statusText: "Too Many Requests",
    headers: [
      ["content-type", "application/json; charset=utf-8"],
      ["retry-after", "10"],
      ["x-ratelimit-limit", String(RATE_MAX)],
      ["x-ratelimit-remaining", "0"],
    ],
    body,
    trace: [
      {
        layer: "gateway",
        label: `edge gateway · window ${RATE_WINDOW / 1000}s penuh (${RATE_MAX}/${RATE_MAX}) — request ditolak sebelum menyentuh middleware`,
        ok: false,
        ms: 1,
      },
    ],
    latency: 2,
    bytes: JSON.stringify(body, null, 2).length,
  };
}

/* ---------- komponen ---------- */

export function Playground() {
  const [tokenId, setTokenId] = useState("staff");
  const [def, setDef] = useState<EndpointDef>(ENDPOINTS[2]);
  const [param, setParam] = useState(ENDPOINTS[2].paramDefault ?? "");
  const [body, setBody] = useState(ENDPOINTS[2].bodyTemplate ?? "");
  const [phase, setPhase] = useState<"idle" | "sending" | "done">("idle");
  const [res, setRes] = useState<SimResult | null>(null);
  const [liveTrace, setLiveTrace] = useState<TraceStep[]>([]);
  const [steps, setSteps] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [rateHits, setRateHits] = useState<number[]>([]);
  const [curlCopied, setCurlCopied] = useState(false);
  const timers = useRef<number[]>([]);

  const token: RoleToken = TOKENS.find((t) => t.id === tokenId)!;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const groups = useMemo(() => {
    const g = new Map<string, EndpointDef[]>();
    ENDPOINTS.forEach((e) => {
      g.set(e.group, [...(g.get(e.group) ?? []), e]);
    });
    return [...g.entries()];
  }, []);

  const pickEndpoint = (e: EndpointDef) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setDef(e);
    setParam(e.paramDefault ?? "");
    setBody(e.bodyTemplate ?? "");
    setPhase("idle");
    setRes(null);
    setSteps(0);
    setLiveTrace([]);
  };

  const remaining = RATE_MAX - rateHits.filter((t) => Date.now() - t < RATE_WINDOW).length;

  const url = def.path.replace(":id", param.trim() || ":id");

  const curl = useMemo(() => {
    const lines = [`curl -X ${def.method} https://api.atlas.dev${url}`];
    if (token.jwt) lines.push(`  -H "Authorization: Bearer ${token.jwt.slice(0, 24)}…"`);
    if (def.bodyTemplate !== undefined)
      lines.push(`  -H "Content-Type: application/json"`, `  -d '${body.replace(/\s+/g, " ").trim()}'`);
    return lines.join(" \\\n");
  }, [def, url, token, body]);

  const copyCurl = async () => {
    try {
      await navigator.clipboard.writeText(curl);
      setCurlCopied(true);
      setTimeout(() => setCurlCopied(false), 1600);
    } catch {
      /* abaikan */
    }
  };

  const send = () => {
    if (phase === "sending") return;
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const nowTs = Date.now();
    const recent = rateHits.filter((t) => nowTs - t < RATE_WINDOW);
    const limited = recent.length >= RATE_MAX;
    setRateHits([...recent, nowTs]);

    const result = limited ? rateLimitedResult() : simulate(token, def, param, body);

    setPhase("sending");
    setRes(null);
    setSteps(0);
    setLiveTrace(result.trace);

    result.trace.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setSteps(i + 1), 240 * (i + 1)));
    });
    timers.current.push(
      window.setTimeout(() => {
        setRes(result);
        setPhase("done");
        setHistory((h) =>
          [{ defId: def.id, method: def.method, path: url, status: result.status, param, body }, ...h].slice(0, 6)
        );
      }, 240 * result.trace.length + 380)
    );
  };

  const applyScenario = (s: Scenario) => {
    if (s.kind === "param") setParam(s.value);
    else setBody(s.value);
  };

  const permissionOk =
    !def.auth || def.permission === null || token.scope.includes("*") || token.scope.includes(def.permission);

  return (
    <section id="demo" className="relative scroll-mt-24 py-24 sm:py-28 bg-ink-900/40 border-y border-line-soft">
      <div className="absolute inset-0 bg-blueprint-flat pointer-events-none [mask-image:linear-gradient(180deg,transparent,black_15%,black_85%,transparent)]" />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead
          index="02"
          kicker="Live Demo · Simulator"
          title={
            <>
              Tembak API-nya <span className="text-ok">dari halaman ini.</span>
            </>
          }
          desc="Simulator ini menjalankan mesin request yang sama dengan aslinya: JWT diverifikasi di middleware, RBAC menahan role yang kurang, Zod memvalidasi payload, state machine menolak transisi ilegal — dan tiap lapisan dilaporkan di panel trace. Ganti role, ganti endpoint, lihat status codenya berubah."
        />

        <div className="mt-12 grid lg:grid-cols-[272px_minmax(0,1fr)] gap-6">
          {/* ============ kolom kiri: role + endpoint ============ */}
          <Reveal className="space-y-5">
            <div className="rounded-xl border border-line bg-ink-900/80 p-4">
              <p className="font-mono text-[10.5px] tracking-[0.2em] text-faint uppercase mb-3">1 · Pilih identitas</p>
              <div className="grid grid-cols-2 gap-2">
                {TOKENS.map((t) => {
                  const active = t.id === tokenId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTokenId(t.id)}
                      className={`text-left rounded-lg border px-3 py-2.5 transition-all duration-200 cursor-pointer ${
                        active
                          ? "border-ok/60 bg-ok/[0.08] shadow-[0_0_0_1px_rgba(62,207,142,0.2)]"
                          : "border-line bg-ink-850/60 hover:border-ink-600"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.hue }} />
                        <span className={`font-display font-semibold text-[13px] ${active ? "text-snow" : "text-snow/80"}`}>
                          {t.label}
                        </span>
                      </span>
                      <span className="block mt-0.5 font-mono text-[10px] text-faint truncate">{t.email}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 rounded-lg border border-line-soft bg-ink-950/70 p-3 font-mono text-[10.5px] leading-relaxed">
                <p className="text-faint mb-1.5">// claim JWT ter-decode</p>
                {token.jwt ? (
                  <>
                    <p><span className="text-info">sub</span>: <span className="text-snow/85">"{token.jwt.includes("MDMi") ? "usr_03" : token.role === "admin" ? "usr_01" : "usr_02"}"</span></p>
                    <p><span className="text-info">role</span>: <span className="text-snow/85">"{token.role}"</span></p>
                    <p className="flex flex-wrap gap-1 mt-1.5">
                      <span className="text-info">scope</span>:
                      {(token.scope.length ? token.scope : ["—"]).map((s) => (
                        <span key={s} className={`px-1.5 rounded border ${s === "*" ? "text-bad border-bad/40 bg-bad/10" : "text-ok border-ok/30 bg-ok/5"}`}>
                          {s}
                        </span>
                      ))}
                    </p>
                  </>
                ) : (
                  <p className="text-faint">tidak ada token — header Authorization dikosongkan</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-line bg-ink-900/80 p-4">
              <p className="font-mono text-[10.5px] tracking-[0.2em] text-faint uppercase mb-3">2 · Pilih endpoint</p>
              <div className="space-y-3">
                {groups.map(([group, eps]) => (
                  <div key={group}>
                    <p className="font-mono text-[10px] text-faint mb-1.5 pl-1">{group}</p>
                    <div className="space-y-1">
                      {eps.map((e) => {
                        const active = e.id === def.id;
                        return (
                          <button
                            key={e.id}
                            onClick={() => pickEndpoint(e)}
                            className={`w-full flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-all duration-200 cursor-pointer ${
                              active
                                ? "border-ok/50 bg-ok/[0.07] translate-x-0.5"
                                : "border-transparent hover:border-line hover:bg-ink-800/60"
                            }`}
                          >
                            <MethodBadge method={e.method} />
                            <span className={`font-mono text-[11.5px] truncate ${active ? "text-snow" : "text-mut"}`}>
                              {e.path.replace("/api/v1", "")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {history.length > 0 && (
              <div className="rounded-xl border border-line bg-ink-900/80 p-4">
                <p className="font-mono text-[10.5px] tracking-[0.2em] text-faint uppercase mb-2.5">Riwayat</p>
                <div className="space-y-1">
                  {history.map((h, i) => {
                    const d = ENDPOINTS.find((e) => e.id === h.defId)!;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          pickEndpoint(d);
                          setParam(h.param);
                          setBody(h.body);
                        }}
                        className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-ink-800/70 transition-colors cursor-pointer"
                      >
                        <span className={`font-mono text-[10.5px] font-bold w-8 ${h.status < 300 ? "text-ok" : h.status < 500 ? "text-warn" : "text-bad"}`}>
                          {h.status}
                        </span>
                        <span className="font-mono text-[10.5px] text-mut truncate">{h.method} {h.path.replace("/api/v1", "")}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Reveal>

          {/* ============ kolom kanan: builder + response ============ */}
          <Reveal delay={120}>
            <div className="grid md:grid-cols-[0.92fr_1.08fr] gap-6 items-start">
              {/* --- request builder --- */}
              <div className="rounded-xl border border-line bg-ink-900/80 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-line-soft bg-ink-850">
                  <p className="font-mono text-[10.5px] tracking-[0.2em] text-faint uppercase">3 · Racik request</p>
                  <span className={`font-mono text-[10px] px-2 py-1 rounded border transition-colors ${
                    remaining <= 2 ? "text-warn border-warn/40 bg-warn/10" : "text-mut border-line"
                  }`}>
                    rate limit {Math.max(0, remaining)}/{RATE_MAX}
                  </span>
                </div>

                <div className="p-4 space-y-3.5">
                  <div className="flex items-center gap-2 rounded-lg border border-line bg-ink-950/80 p-2">
                    <MethodBadge method={def.method} className="text-[11.5px] px-2 py-1" />
                    <span className="font-mono text-[12px] text-snow/90 truncate">
                      {url}
                    </span>
                  </div>

                  <p className="text-[12.5px] text-mut leading-snug">{def.summary}.</p>

                  <div className={`flex items-center gap-2 font-mono text-[10.5px] rounded-md border px-2.5 py-2 ${
                    permissionOk ? "border-ok/25 bg-ok/5 text-ok" : "border-bad/25 bg-bad/5 text-bad"
                  }`}>
                    {permissionOk ? (
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden><path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    )}
                    {def.auth
                      ? def.permission
                        ? `butuh permission '${def.permission}' — role ${token.label} ${permissionOk ? "punya ✓" : "TIDAK punya ✗ (akan 401/403)"}`
                        : `butuh token apa pun — role ${token.label} ${permissionOk ? "lolos ✓" : "akan kena 401"}`
                      : "endpoint publik — tanpa token"}
                  </div>

                  {def.hasParam && (
                    <label className="block">
                      <span className="font-mono text-[10.5px] text-faint block mb-1.5">parameter :id</span>
                      <input
                        value={param}
                        onChange={(e) => setParam(e.target.value)}
                        placeholder="ord_1042"
                        className="w-full rounded-md border border-line bg-ink-950/80 px-3 py-2.5 font-mono text-[12.5px] text-snow outline-none focus:border-ok/60 focus:shadow-[0_0_0_3px_rgba(62,207,142,0.12)] transition-all placeholder:text-faint"
                      />
                    </label>
                  )}

                  {def.bodyTemplate !== undefined && (
                    <label className="block">
                      <span className="font-mono text-[10.5px] text-faint block mb-1.5">body · application/json</span>
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={7}
                        spellCheck={false}
                        className="w-full rounded-md border border-line bg-ink-950/80 px-3 py-2.5 font-mono text-[12px] leading-relaxed text-snow outline-none focus:border-info/60 focus:shadow-[0_0_0_3px_rgba(88,182,245,0.12)] transition-all resize-y"
                      />
                    </label>
                  )}

                  {SCENARIOS[def.id] && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="font-mono text-[10px] text-faint self-center mr-1">coba skenario:</span>
                      {SCENARIOS[def.id].map((s) => (
                        <button
                          key={s.label}
                          onClick={() => applyScenario(s)}
                          className="font-mono text-[10.5px] text-mut border border-line rounded-full px-2.5 py-1 hover:border-warn/50 hover:text-warn transition-colors cursor-pointer"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={send}
                      disabled={phase === "sending"}
                      className={`flex-1 font-mono text-[13px] font-bold px-4 py-3 rounded-md transition-all cursor-pointer ${
                        phase === "sending"
                          ? "bg-ink-700 text-mut cursor-wait"
                          : "bg-ok text-ink-950 hover:bg-[#5fe0a6] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_rgba(62,207,142,0.5)]"
                      }`}
                    >
                      {phase === "sending" ? "▸▸ mengirim…" : `Kirim ${def.method} ▸`}
                    </button>
                    <button
                      onClick={copyCurl}
                      className={`font-mono text-[11.5px] px-3.5 rounded-md border transition-all cursor-pointer ${
                        curlCopied ? "border-ok/50 text-ok bg-ok/10" : "border-line text-mut hover:text-snow hover:border-ink-600"
                      }`}
                    >
                      {curlCopied ? "✓" : "cURL"}
                    </button>
                  </div>

                  <details className="group">
                    <summary className="font-mono text-[10.5px] text-faint cursor-pointer hover:text-mut transition-colors list-none">
                      <span className="group-open:hidden">+ lihat perintah cURL</span>
                      <span className="hidden group-open:inline">− sembunyikan cURL</span>
                    </summary>
                    <pre className="mt-2 rounded-md border border-line-soft bg-ink-950/80 p-3 font-mono text-[11px] leading-relaxed text-mut whitespace-pre-wrap break-all">
                      {curl}
                    </pre>
                  </details>
                </div>
              </div>

              {/* --- response panel --- */}
              <div className="rounded-xl border border-line bg-ink-900/80 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-line-soft bg-ink-850">
                  <p className="font-mono text-[10.5px] tracking-[0.2em] text-faint uppercase">4 · Response + trace</p>
                  {res && phase === "done" && (
                    <span className="font-mono text-[10.5px] text-mut">
                      {res.latency}ms · {res.bytes} B
                    </span>
                  )}
                </div>

                {phase === "idle" && (
                  <div className="p-8 text-center">
                    <div className="mx-auto w-14 h-14 grid place-items-center rounded-xl border border-line bg-ink-850 mb-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="var(--color-ok)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="font-display font-semibold text-snow/90 text-[15px]">Belum ada request</p>
                    <p className="mt-1.5 text-[12.5px] text-mut leading-relaxed max-w-[260px] mx-auto">
                      Pilih role & endpoint di kiri, lalu tekan <span className="text-ok font-mono text-[11.5px]">Kirim</span>.
                      Trace lapisan akan menyala satu per satu.
                    </p>
                  </div>
                )}

                {phase === "sending" && (
                  <div className="p-4">
                    <TraceView trace={liveTrace} steps={steps} pending />
                    <div className="mt-4 space-y-2 animate-pulse">
                      <div className="h-8 rounded bg-ink-700/60 w-2/5" />
                      <div className="h-3 rounded bg-ink-700/40 w-full" />
                      <div className="h-3 rounded bg-ink-700/40 w-11/12" />
                      <div className="h-3 rounded bg-ink-700/40 w-4/5" />
                    </div>
                  </div>
                )}

                {phase === "done" && res && (
                  <div className="animate-riseline">
                    <div className="flex items-center gap-3 px-4 pt-4">
                      <span className={`font-mono text-[15px] font-bold px-3 py-1.5 rounded-md border ${statusColor(res.status)}`}>
                        {res.status} {res.statusText}
                      </span>
                      <span className="font-mono text-[10.5px] text-faint">
                        {res.headers.find(([k]) => k === "x-request-id")?.[1]}
                      </span>
                    </div>

                    <div className="px-4 pt-4">
                      <p className="font-mono text-[10px] tracking-[0.2em] text-faint uppercase mb-2">Jejak lapisan</p>
                      <TraceView trace={res.trace} steps={res.trace.length} />
                    </div>

                    <div className="px-4 pt-4">
                      <p className="font-mono text-[10px] tracking-[0.2em] text-faint uppercase mb-2">Headers</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-line-soft bg-ink-950/60 p-3">
                        {res.headers.map(([k, v]) => (
                          <p key={k} className="font-mono text-[10.5px] truncate">
                            <span className="text-info">{k}</span>
                            <span className="text-faint">: </span>
                            <span className="text-mut">{v}</span>
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="font-mono text-[10px] tracking-[0.2em] text-faint uppercase mb-2">Body</p>
                      <div className="rounded-lg border border-line-soft bg-ink-950/70 p-3.5 max-h-[340px] overflow-auto">
                        {res.body ? (
                          <JsonView data={res.body} />
                        ) : (
                          <p className="font-mono text-[11.5px] text-faint">
                            204 No Content — body kosong sesuai spesifikasi HTTP.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- trace lapisan ---------- */

function TraceView({ trace, steps, pending }: { trace: TraceStep[]; steps: number; pending?: boolean }) {
  const visible = trace.slice(0, steps);
  return (
    <ol className="space-y-1.5">
      {visible.map((s, i) => {
        const meta = LAYER_META[s.layer];
        const isLast = i === visible.length - 1 && pending;
        return (
          <li key={i} className="animate-riseline flex items-start gap-2.5">
            <span className={`shrink-0 mt-0.5 font-mono text-[8.5px] font-bold tracking-wider px-1.5 py-1 rounded border ${s.ok ? meta.cls : "text-bad border-bad/50 bg-bad/10"}`}>
              {meta.label}
            </span>
            <span className={`font-mono text-[11px] leading-relaxed ${s.ok ? "text-mut" : "text-bad"}`}>
              {s.label}
              <span className="text-faint"> · {s.ms}ms</span>
              {isLast && <span className="inline-block w-1.5 h-3 bg-ok/80 ml-1.5 animate-blink align-middle" />}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
