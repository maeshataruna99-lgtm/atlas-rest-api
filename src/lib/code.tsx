import { useState, type ReactNode } from "react";

/* ---------- highlighter ringan untuk snippet multi-bahasa ---------- */

const TOKEN_RE =
  /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\/\/[^\n]*|#[^\n]*)|(\b\d[\d_]*(?:\.\d+)?\b)|(@[A-Za-z_][\w]*)|(\b(?:const|let|var|function|return|if|else|for|of|in|new|throw|await|async|import|from|export|type|interface|extends|public|private|readonly|enum|class|try|catch|finally|switch|case|break|default|this|null|undefined|true|false|void|static|as|keyof|typeof|constructor|describe|it|expect|beforeAll|model|generator|datasource|provider|url|relation|services|image|build|ports|environment|depends_on|volumes|restart|command|healthcheck|test|expose|FROM|AS|RUN|WORKDIR|COPY|EXPOSE|CMD|ENV|USER|HEALTHCHECK|GET|POST|PATCH|DELETE|PUT)\b)/g;

export function highlightCode(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of code.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(<span key={key++}>{code.slice(last, idx)}</span>);
    const cls = m[1] ? "tok-s" : m[2] ? "tok-c" : m[3] ? "tok-n" : m[4] ? "tok-d" : "tok-k";
    out.push(
      <span key={key++} className={cls}>
        {m[0]}
      </span>
    );
    last = idx + m[0].length;
  }
  if (last < code.length) out.push(<span key={key++}>{code.slice(last)}</span>);
  return out;
}

/* ---------- renderer JSON berwarna (rekursif) ---------- */

function JVal({ v, depth }: { v: unknown; depth: number }): ReactNode {
  if (v === null || v === undefined) return <span className="text-faint">null</span>;
  if (typeof v === "string") return <span className="tok-s">"{v}"</span>;
  if (typeof v === "number") return <span className="tok-n">{String(v)}</span>;
  if (typeof v === "boolean") return <span className="tok-k">{String(v)}</span>;
  if (Array.isArray(v)) {
    if (v.length === 0) return <span className="text-faint">[]</span>;
    return (
      <span>
        {"[\n"}
        {v.map((item, i) => (
          <span key={i}>
            {"  ".repeat(depth + 1)}
            <JVal v={item} depth={depth + 1} />
            {i < v.length - 1 ? "," : ""}
            {"\n"}
          </span>
        ))}
        {"  ".repeat(depth)}
        {"]"}
      </span>
    );
  }
  const entries = Object.entries(v as Record<string, unknown>);
  if (entries.length === 0) return <span className="text-faint">{"{}"}</span>;
  return (
    <span>
      {"{\n"}
      {entries.map(([k, val], i) => (
        <span key={k}>
          {"  ".repeat(depth + 1)}
          <span className="text-info/90">"{k}"</span>
          <span className="text-faint">: </span>
          <JVal v={val} depth={depth + 1} />
          {i < entries.length - 1 ? "," : ""}
          {"\n"}
        </span>
      ))}
      {"  ".repeat(depth)}
      {"}"}
    </span>
  );
}

export function JsonView({ data }: { data: unknown }) {
  return (
    <pre className="font-mono text-[12px] leading-relaxed text-snow/90 whitespace-pre overflow-x-auto">
      <JVal v={data} depth={0} />
    </pre>
  );
}

/* ---------- CodeBlock dengan header file + tombol salin ---------- */

export function CodeBlock({
  code,
  file,
  className = "",
  maxH,
}: {
  code: string;
  file?: string;
  className?: string;
  maxH?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard tidak tersedia — abaikan */
    }
  };

  return (
    <div className={`rounded-lg border border-line bg-ink-900/90 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-line-soft bg-ink-850">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex gap-1.5 shrink-0">
            <i className="w-2.5 h-2.5 rounded-full bg-bad/60" />
            <i className="w-2.5 h-2.5 rounded-full bg-warn/60" />
            <i className="w-2.5 h-2.5 rounded-full bg-ok/60" />
          </span>
          {file && (
            <span className="font-mono text-[11px] text-mut truncate">{file}</span>
          )}
        </div>
        <button
          onClick={copy}
          className={`shrink-0 font-mono text-[11px] px-2.5 py-1 rounded border transition-all duration-200 cursor-pointer ${
            copied
              ? "border-ok/50 text-ok bg-ok/10"
              : "border-line text-mut hover:text-snow hover:border-ink-600"
          }`}
        >
          {copied ? "✓ tersalin" : "salin"}
        </button>
      </div>
      <div className="p-4 overflow-auto" style={maxH ? { maxHeight: maxH } : undefined}>
        <pre className="font-mono text-[12px] leading-[1.7] text-snow/85 whitespace-pre">
          {highlightCode(code)}
        </pre>
      </div>
    </div>
  );
}
