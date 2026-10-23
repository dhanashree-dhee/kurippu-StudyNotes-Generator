import { useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Eye,
  Lightbulb,
  ListChecks,
  Mic,
  Network,
  Printer,
  Star,
  Captions,
  HelpCircle,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { notesToMarkdown, type StudyNotes } from "@/lib/notes-types";
import { youTubeThumbnail, youTubeWatchUrl } from "@/lib/youtube";
import { MermaidDiagram } from "./MermaidDiagram";

const SOURCE_META = {
  speech: { label: "Speech", icon: Mic },
  "captions or on-screen text": { label: "Captions / screen text", icon: Captions },
  "visual demonstration": { label: "Visuals", icon: Eye },
} as const;

function Section({
  id,
  icon: Icon,
  title,
  children,
  tone = "default",
}: {
  id: string;
  icon: typeof BookOpen;
  title: string;
  children: React.ReactNode;
  tone?: "default" | "coral" | "mint" | "highlight" | "sky";
}) {
  const toneClass = {
    default: "bg-secondary text-foreground",
    coral: "bg-coral text-coral-foreground",
    mint: "bg-mint text-mint-foreground",
    highlight: "bg-accent text-accent-foreground",
    sky: "bg-sky text-primary",
  }[tone];
  return (
    <section id={id} className="print-break animate-write-in scroll-mt-20">
      <div className="mb-3 flex items-center gap-2.5">
        <span className={`inline-flex size-8 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="size-4" />
        </span>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function NotesView({
  notes,
  videoId,
  language,
}: {
  notes: StudyNotes;
  videoId: string;
  language?: string;
}) {
  const rtl = !!(language && getLanguage(language)?.rtl);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  const nav = [
    { id: "definitions", label: "Definitions", show: notes.definitions.length > 0 },
    { id: "important", label: "Important points", show: notes.importantPoints.length > 0 },
    { id: "key", label: "Key points", show: notes.keyPoints.length > 0 },
    { id: "diagram", label: "Diagram", show: !!notes.diagram.mermaid },
    { id: "topics", label: "Topics", show: notes.importantTopics.length > 0 },
    { id: "screen", label: "From screen", show: notes.visualNotes.length > 0 },
    { id: "exam", label: "Exam Qs", show: notes.examQuestions.length > 0 },
  ].filter((n) => n.show);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(notesToMarkdown(notes));
      setCopied(true);
      toast.success("Notes copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — try Save as PDF instead");
    }
  };

  return (
    <article className="space-y-8">
      {/* Title card */}
      <header className="bg-ruled overflow-hidden rounded-2xl border shadow-paper">
        <div className="flex gap-3 p-4 pl-12 sm:p-6 sm:pl-14">
          <a
            href={youTubeWatchUrl(videoId)}
            target="_blank"
            rel="noreferrer"
            className="no-print hidden shrink-0 sm:block"
          >
            <img
              src={youTubeThumbnail(videoId)}
              alt=""
              className="h-24 w-40 rounded-lg border object-cover"
            />
          </a>
          <div className="min-w-0">
            {notes.subject && (
              <p className="font-hand text-xl leading-none text-coral">{notes.subject}</p>
            )}
            <h1 className="mt-1 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              {notes.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {notes.sourcesUsed.map((s) => {
                const meta = SOURCE_META[s];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    <Icon className="size-3" /> {meta.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        {notes.overview && (
          <p className="border-t border-dashed px-4 py-4 pl-12 leading-8 sm:px-6 sm:pl-14">
            {notes.overview}
          </p>
        )}
      </header>

      {/* Actions + jump nav */}
      <div className="no-print sticky top-0 z-10 -mx-4 space-y-2 bg-background/90 px-4 py-2 backdrop-blur">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copy} className="flex-1 sm:flex-none">
            {copied ? <Check /> : <Copy />} Copy notes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex-1 sm:flex-none"
          >
            <Printer /> Save as PDF
          </Button>
        </div>
        <nav className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {nav.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent"
            >
              {n.label}
            </a>
          ))}
        </nav>
      </div>

      {notes.definitions.length > 0 && (
        <Section id="definitions" icon={BookOpen} title="Short definitions" tone="sky">
          <dl className="divide-y rounded-2xl border bg-card shadow-paper">
            {notes.definitions.map((d, i) => (
              <div key={i} className="p-4">
                <dt className="font-display text-base font-semibold">
                  <span className="marker">{d.term}</span>
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {d.definition}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {notes.importantPoints.length > 0 && (
        <Section id="important" icon={Star} title="Important points" tone="coral">
          <ol className="space-y-3">
            {notes.importantPoints.map((p, i) => (
              <li key={i} className="flex gap-3 rounded-xl border bg-card p-4 shadow-paper">
                <span className="font-display text-lg font-semibold leading-6 text-coral">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-relaxed">{p}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {notes.keyPoints.length > 0 && (
        <Section id="key" icon={ListChecks} title="Key points — quick revision" tone="mint">
          <ul className="bg-ruled rounded-2xl border py-2 pl-12 pr-4 shadow-paper">
            {notes.keyPoints.map((p, i) => (
              <li key={i} className="flex min-h-8 items-start gap-2 leading-8">
                <Check className="mt-2 size-4 shrink-0 text-mint-foreground" />
                <span className="font-medium">{p}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {notes.diagram.mermaid && (
        <Section id="diagram" icon={Network} title={notes.diagram.title || "Diagram"} tone="highlight">
          <div className="rounded-2xl border bg-card p-3 shadow-paper">
            <MermaidDiagram code={notes.diagram.mermaid} />
            {notes.diagram.caption && (
              <p className="mt-3 px-1 font-hand text-lg leading-snug text-primary">
                {notes.diagram.caption}
              </p>
            )}
          </div>
        </Section>
      )}

      {notes.importantTopics.length > 0 && (
        <Section id="topics" icon={Layers} title="Important topics">
          <div className="grid gap-3 sm:grid-cols-2">
            {notes.importantTopics.map((t, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 shadow-paper">
                <h3 className="text-base font-semibold">{t.topic}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t.explanation}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {notes.visualNotes.length > 0 && (
        <Section id="screen" icon={Eye} title="From the board & screen" tone="sky">
          <ul className="space-y-2 rounded-2xl border border-dashed bg-muted p-4">
            {notes.visualNotes.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {notes.examQuestions.length > 0 && (
        <Section id="exam" icon={HelpCircle} title="Likely exam questions" tone="coral">
          <div className="space-y-2">
            {notes.examQuestions.map((q, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className="rounded-xl border bg-card shadow-paper">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-start gap-3 p-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display font-semibold text-coral">Q{i + 1}</span>
                    <span className="flex-1 text-sm font-medium leading-relaxed">{q.question}</span>
                    <ChevronDown
                      className={`no-print mt-0.5 size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <p
                    className={`border-t border-dashed px-4 py-3 pl-11 text-sm leading-relaxed text-muted-foreground ${isOpen ? "block" : "hidden print:block"}`}
                  >
                    {q.answer}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </article>
  );
}
