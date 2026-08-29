import { useState } from "react";
import { ERROR_CATALOG, PERMISSIONS, RBAC_MATRIX, RBAC_ROLES } from "../data/api";
import { SNIPPETS } from "../data/snippets";
import { CodeBlock, JsonView } from "../lib/code";
import { Reveal, SectionHead } from "./Reveal";

const STATUS_DOT: Record<number, string> = {
  400: "bg-warn",
  401: "bg-warn",
  403: "bg-warn",
  404: "bg-info",
  409: "bg-warn",
  422: "bg-info",
  429: "bg-cy",
  500: "bg-bad",
};

export function ErrorsSection() {
  const [selected, setSelected] = useState(6); // VALIDATION_ERROR sebagai pembuka
  const err = ERROR_CATALOG[selected];
  const errorsSnippet = SNIPPETS.find((s) => s.id === "errors")!;
  const handlerSnippet = SNIPPETS.find((s) => s.id === "errorHandler")!;

  return (
    <section id="errors" className="relative scroll-mt-24 py-24 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead
          index="03"
          kicker="Comprehensive Error Handling"
          title={
            <>
              Error itu <span className="text-warn">data</span>,
              <br /> bukan string dilempar sembarangan.
            </>
          }
          desc="Satu hierarki ApiError, satu errorHandler global, satu bentuk envelope untuk semua kegagalan — dari Zod yang menolak payload sampai bug yang tak terduga. Client selalu tahu: apa yang salah, di field mana, dan request id untuk menelusuri log."
        />

        <div className="mt-14 grid lg:grid-cols-2 gap-6 items-start">
          <Reveal>
            <CodeBlock code={errorsSnippet.code} file={errorsSnippet.file} maxH="400px" />
            <div className="mt-4 rounded-lg border border-line bg-ink-900/70 p-4">
              <p className="font-mono text-[10.5px] tracking-[0.2em] text-faint uppercase mb-2.5">
                Envelope error — bentuk tunggal
              </p>
              <JsonView
                data={{
                  success: false,
                  error: {
                    code: "ORDER_NOT_FOUND",
                    message: "Pesanan 'ord_9999' tidak ditemukan.",
                    requestId: "req_7d2f91ae",
                    timestamp: "2026-02-14T08:12:44Z",
                  },
                }}
              />
              <ul className="mt-3 space-y-1.5 text-[12.5px] text-mut">
                <li>• <span className="font-mono text-[11.5px] text-info">code</span> — stabil & machine-readable, aman dipakai client untuk logika retry/UI</li>
                <li>• <span className="font-mono text-[11.5px] text-info">requestId</span> — jembatan ke log server & Sentry</li>
                <li>• stack trace <span className="text-bad">tidak pernah</span> bocor ke client; hanya masuk log</li>
              </ul>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-xl border border-line bg-ink-900/80 overflow-hidden">
              <div className="px-4 py-3 border-b border-line-soft bg-ink-850">
                <p className="font-mono text-[10.5px] tracking-[0.2em] text-faint uppercase">
                  Katalog error — klik untuk melihat respons
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-line-soft">
                {ERROR_CATALOG.map((e, i) => {
                  const active = i === selected;
                  return (
                    <button
                      key={e.code}
                      onClick={() => setSelected(i)}
                      className={`text-left px-3.5 py-3 transition-all duration-200 cursor-pointer ${
                        active ? "bg-ink-700" : "bg-ink-900 hover:bg-ink-800"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[e.status]}`} />
                        <span className={`font-mono text-[12.5px] font-bold ${active ? "text-snow" : "text-snow/75"}`}>
                          {e.status}
                        </span>
                      </span>
                      <span className={`block mt-1 font-mono text-[9.5px] truncate ${active ? "text-warn" : "text-faint"}`}>
                        {e.code}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div key={err.code} className="animate-riseline p-4 border-t border-line-soft">
                <div className="flex flex-wrap items-center gap-2.5 mb-3">
                  <span className="font-mono text-[13px] font-bold text-snow">{err.status}</span>
                  <span className="font-mono text-[12px] text-warn">{err.code}</span>
                  <span className="ml-auto font-mono text-[10px] text-faint border border-line rounded px-2 py-1">
                    dilempar di: {err.layer}
                  </span>
                </div>
                <p className="text-[13px] text-mut mb-3">
                  <span className="text-snow/85">Pemicu:</span> {err.trigger}
                </p>
                <div className="rounded-lg border border-line-soft bg-ink-950/70 p-3.5 max-h-[240px] overflow-auto">
                  <JsonView data={err.sample} />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <CodeBlock code={handlerSnippet.code} file={handlerSnippet.file} maxH="300px" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ================= RBAC ================= */

const ROLE_DOTS = ["bg-faint", "bg-info", "bg-warn", "bg-bad"];

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-label="boleh">
      <circle cx="9" cy="9" r="8" stroke="var(--color-ok)" strokeOpacity="0.35" strokeWidth="1.4" />
      <path d="M5.5 9.3l2.4 2.4 4.6-5.2" stroke="var(--color-ok)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CrossIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-label="ditolak">
      <circle cx="9" cy="9" r="8" stroke="var(--color-line)" strokeWidth="1.4" />
      <path d="M6.2 6.2l5.6 5.6M11.8 6.2l-5.6 5.6" stroke="var(--color-faint)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function RbacSection() {
  const rbacSnippet = SNIPPETS.find((s) => s.id === "rbac")!;

  return (
    <section id="rbac" className="relative scroll-mt-24 py-24 sm:py-28 bg-ink-900/40 border-y border-line-soft">
      <div className="absolute inset-0 bg-blueprint-flat pointer-events-none [mask-image:linear-gradient(180deg,transparent,black_20%,black_80%,transparent)]" />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead
          index="04"
          kicker="Role-Based Access Control"
          title={
            <>
              Siapa boleh berbuat apa —<br />
              diputuskan <span className="text-bad">sebelum</span> logika bisnis jalan.
            </>
          }
          desc="Permission granular dipetakan ke role di database, dibawa sebagai claim JWT, dan dicegat guard di level middleware. Controller dan service tidak perlu tahu siapa yang memanggil — mereka hanya bekerja kalau guard sudah meloloskan."
        />

        <div className="mt-14 grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
          <Reveal>
            <div className="rounded-xl border border-line bg-ink-900/80 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-line-soft bg-ink-850">
                <p className="font-mono text-[10.5px] tracking-[0.2em] text-faint uppercase">Matriks permission × role</p>
                <p className="font-mono text-[10px] text-faint hidden sm:block">✗ = 403 FORBIDDEN oleh rbac.guard</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-line-soft">
                      <th className="px-4 py-3 font-mono text-[10.5px] tracking-wider text-faint uppercase font-medium">Permission</th>
                      {RBAC_ROLES.map((r, i) => (
                        <th key={r} className="px-3 py-3 text-center">
                          <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] tracking-wider text-mut uppercase font-medium">
                            <span className={`w-1.5 h-1.5 rounded-full ${ROLE_DOTS[i]}`} />
                            {r}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSIONS.map((p, pi) => (
                      <tr
                        key={p.key}
                        className={`group transition-colors hover:bg-ink-800/70 ${pi > 0 ? "border-t border-line-soft" : ""}`}
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-[11.5px] text-cy">{p.key}</span>
                          <span className="block text-[11.5px] text-faint mt-0.5">{p.label}</span>
                        </td>
                        {RBAC_MATRIX[p.key].map((allowed, ri) => (
                          <td key={ri} className="px-3 py-3.5 text-center">
                            <span className="inline-block transition-transform duration-200 group-hover:scale-110">
                              {allowed ? <CheckIcon /> : <CrossIcon />}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-line-soft bg-ink-850/60">
                <p className="font-mono text-[11px] text-mut leading-relaxed">
                  <span className="text-bad">Admin</span> membawa scope <span className="text-bad">"*"</span> — wildcard yang
                  tetap dicatat audit log setiap kali dipakai.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120} className="space-y-4">
            <CodeBlock code={rbacSnippet.code} file={rbacSnippet.file} maxH="430px" />

            <div className="rounded-xl border border-line bg-ink-900/80 p-4">
              <p className="font-mono text-[10.5px] tracking-[0.2em] text-faint uppercase mb-3">Alur penegakan</p>
              <ol className="space-y-2.5">
                {[
                  { n: "1", t: "Login sukses", d: "auth.service menerbitkan JWT berisi sub, role, dan scope permission." },
                  { n: "2", t: "authenticate", d: "middleware memverifikasi tanda tangan & expiry — gagal = 401." },
                  { n: "3", t: "requirePermission('orders:update-status')", d: "guard membandingkan scope di claim — kurang = 403 + detail." },
                  { n: "4", t: "Baru kemudian controller & service bekerja", d: "logika bisnis tak pernah melihat token." },
                ].map((s) => (
                  <li key={s.n} className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 grid place-items-center rounded-md border border-warn/40 bg-warn/10 font-mono text-[11px] font-bold text-warn">
                      {s.n}
                    </span>
                    <div>
                      <p className="font-mono text-[12px] text-snow/90">{s.t}</p>
                      <p className="text-[12px] text-mut leading-relaxed mt-0.5">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
