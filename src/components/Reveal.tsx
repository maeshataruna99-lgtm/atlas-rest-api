import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("on");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`rv ${className}`}
      style={{ "--rv-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

export function SectionHead({
  index,
  kicker,
  title,
  desc,
}: {
  index: string;
  kicker: string;
  title: ReactNode;
  desc?: string;
}) {
  return (
    <Reveal className="max-w-3xl">
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-[11px] tracking-[0.25em] text-ok">{index}</span>
        <span className="h-px w-10 bg-ok/40" />
        <span className="font-mono text-[11px] tracking-[0.25em] text-faint uppercase">{kicker}</span>
      </div>
      <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.08] text-snow tracking-tight">
        {title}
      </h2>
      {desc && <p className="mt-4 text-mut text-[15px] leading-relaxed">{desc}</p>}
    </Reveal>
  );
}
