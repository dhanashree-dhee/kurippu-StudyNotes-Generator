import { useEffect, useId, useState } from "react";

let initialized = false;

export function MermaidDiagram({ code }: { code: string }) {
  const rawId = useId();
  const id = `mmd-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    setFailed(false);
    if (!code.trim()) {
      setFailed(true);
      return;
    }
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        if (!initialized) {
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: "neutral",
            flowchart: { htmlLabels: true, curve: "basis", useMaxWidth: true },
          });
          initialized = true;
        }
        const { svg } = await mermaid.render(id, code);
        if (!cancelled) setSvg(svg);
      } catch {
        document.getElementById(id)?.remove();
        document.getElementById(`d${id}`)?.remove();
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (failed) {
    return (
      <div className="rounded-xl border border-dashed bg-muted p-4">
        <p className="mb-2 text-sm text-muted-foreground">
          The diagram couldn't be drawn, here's its outline:
        </p>
        <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed">{code}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        Drawing diagram…
      </div>
    );
  }

  return (
    <div
      className="notes-diagram overflow-x-auto rounded-xl bg-card p-2"
      // Mermaid output rendered with securityLevel "strict"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
