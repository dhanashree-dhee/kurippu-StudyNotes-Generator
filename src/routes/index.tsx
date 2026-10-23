import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowRight, Captions, Eye, Link2, Mic, PencilLine, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotesView } from "@/components/notes/NotesView";
import { generateStudyNotes } from "@/lib/notes.functions";
import { LANGUAGES, getLanguage, type NotesLanguage, type StudyNotes } from "@/lib/notes-types";
import { extractYouTubeId, youTubeThumbnail } from "@/lib/youtube";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kurippu — YouTube lecture to study notes" },
      {
        name: "description",
        content:
          "Paste a YouTube lecture link and get study notes: short definitions, important points, key points, diagrams and important topics.",
      },
      { property: "og:title", content: "Kurippu — YouTube lecture to study notes" },
      {
        property: "og:description",
        content:
          "Works with spoken lectures, captioned videos and silent whiteboard videos. Get definitions, key points, diagrams and exam questions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Saved = { videoId: string; notes: StudyNotes; language: NotesLanguage; at: number };
const HISTORY_KEY = "kurippu-history";

const LOADING_STEPS = [
  "Watching the video…",
  "Listening to the teacher…",
  "Reading the board & captions…",
  "Picking out important points…",
  "Drawing the diagram…",
  "Writing your notes…",
];

function Index() {
  const generate = useServerFn(generateStudyNotes);
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState<NotesLanguage>("english");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ videoId: string; notes: StudyNotes } | null>(null);
  const [history, setHistory] = useState<Saved[]>([]);
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!loadingId) return;
    setStep(0);
    setSeconds(0);
    const a = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 4500);
    const b = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [loadingId]);

  const saveHistory = (entry: Saved) => {
    const next = [entry, ...history.filter((h) => h.videoId !== entry.videoId)].slice(0, 6);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      /* storage full */
    }
  };

  const removeHistory = (videoId: string) => {
    const next = history.filter((h) => h.videoId !== videoId);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      setError("That doesn't look like a YouTube link. Paste a link like youtube.com/watch?v=… or youtu.be/…");
      return;
    }
    setResult(null);
    setLoadingId(videoId);
    try {
      const res = await generate({ data: { url, language } });
      if (res.ok) {
        setResult({ videoId, notes: res.notes });
        saveHistory({ videoId, notes: res.notes, language, at: Date.now() });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  const reset = () => {
    setResult(null);
    setUrl("");
    setError(null);
  };

  return (
    <div className="min-h-screen">
      <header className="no-print mx-auto flex max-w-3xl items-center justify-between px-4 pt-5">
        <button type="button" onClick={reset} className="flex items-center gap-2">
          <span className="inline-flex size-9 rotate-[-6deg] items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lift">
            <PencilLine className="size-4" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">Kurippu</span>
        </button>
        {result && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw /> New video
          </Button>
        )}
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-8">
        {result ? (
          <NotesView notes={result.notes} videoId={result.videoId} />
        ) : loadingId ? (
          <LoadingCard videoId={loadingId} step={step} seconds={seconds} />
        ) : (
          <>
            <section className="animate-write-in">
              <p className="font-hand text-2xl text-coral">paste · wait · study</p>
              <h1 className="mt-1 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                Any YouTube lecture, turned into <span className="marker">study notes</span>.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                Definitions, important points, key points, a diagram and important topics — even
                when the video has no sound or no captions.
              </p>
            </section>

            <form
              onSubmit={submit}
              className="mt-8 rounded-2xl border bg-card p-4 shadow-paper sm:p-5"
            >
              <label htmlFor="yt" className="text-sm font-semibold">
                YouTube link
              </label>
              <div className="relative mt-2">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="yt"
                  inputMode="url"
                  autoComplete="off"
                  placeholder="https://youtu.be/…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-12 bg-background pl-9 text-base"
                />
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">Notes language</span>
                  <span className="text-xs text-muted-foreground">
                    Video can be in any language
                  </span>
                </div>
                <div
                  role="radiogroup"
                  aria-label="Notes language"
                  className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1 sm:grid-cols-5"
                >
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      role="radio"
                      onClick={() => setLanguage(l.id)}
                      aria-checked={language === l.id}
                      className={`flex min-h-12 flex-col items-center justify-center rounded-lg px-1 py-1.5 text-center transition-all ${
                        language === l.id
                          ? "bg-card text-foreground shadow-paper ring-2 ring-primary"
                          : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                      }`}
                    >
                      <span className="text-sm font-semibold leading-tight">{l.native}</span>
                      {l.native !== l.english && (
                        <span className="mt-0.5 text-[10px] leading-tight opacity-80">
                          {l.english}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="mt-5 h-12 w-full text-base">
                Make my notes <ArrowRight />
              </Button>
            </form>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                { icon: Mic, label: "Spoken lectures" },
                { icon: Captions, label: "Captions only" },
                { icon: Eye, label: "Silent / board only" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed p-3 text-center"
                >
                  <Icon className="size-5 text-primary" />
                  <span className="text-xs font-medium leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {history.length > 0 && (
              <section className="mt-10">
                <h2 className="text-lg font-semibold">Your recent notes</h2>
                <ul className="mt-3 space-y-2">
                  {history.map((h) => (
                    <li key={h.videoId} className="flex items-center gap-3 rounded-xl border bg-card p-2 pr-1">
                      <button
                        type="button"
                        onClick={() => setResult({ videoId: h.videoId, notes: h.notes })}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <img
                          src={youTubeThumbnail(h.videoId)}
                          alt=""
                          className="h-12 w-20 shrink-0 rounded-md object-cover"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{h.notes.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {h.notes.subject || LANGUAGE_LABELS[h.language]}
                          </span>
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove"
                        onClick={() => removeHistory(h.videoId)}
                      >
                        <X />
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function LoadingCard({ videoId, step, seconds }: { videoId: string; step: number; seconds: number }) {
  return (
    <section className="animate-write-in" aria-live="polite">
      <div className="relative overflow-hidden rounded-2xl border shadow-paper">
        <img src={youTubeThumbnail(videoId)} alt="" className="aspect-video w-full object-cover" />
        <div className="absolute inset-0 bg-foreground/30" />
        <div className="animate-scan absolute inset-x-0 h-1 bg-accent shadow-[0_0_24px_var(--accent)]" />
      </div>
      <div className="bg-ruled mt-5 rounded-2xl border p-5 pl-12 shadow-paper">
        <div className="flex items-center gap-3">
          <PencilLine className="animate-pencil size-6 text-primary" />
          <p key={step} className="animate-write-in font-hand text-2xl leading-8">
            {LOADING_STEPS[step]}
          </p>
        </div>
        <p className="mt-2 text-sm leading-8 text-muted-foreground">
          {seconds}s · Long lectures can take 1–3 minutes. Keep this page open.
        </p>
      </div>
    </section>
  );
}
