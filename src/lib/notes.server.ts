import { STUDY_NOTES_SCHEMA, type NotesLanguage, type NotesResult, type StudyNotes } from "./notes-types";
import { youTubeWatchUrl } from "./youtube";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
// Gemini watches the YouTube video directly: frames, audio track and on-screen text.
const MODEL = "google/gemini-3.8-flash";

const LANGUAGE_RULES: Record<NotesLanguage, string> = {
  english: "Write all notes in clear, simple English.",
  tamil:
    "Write all notes in Tamil script (தமிழ்). Keep technical/scientific terms in English inside brackets after the Tamil word, e.g. ஒளிச்சேர்க்கை (Photosynthesis).",
  tanglish:
    "Write all notes in Tanglish — Tamil language written using English letters (e.g. 'Ithu romba important concept'). Keep technical terms in English.",
};

function systemPrompt(language: NotesLanguage) {
  return `You are an expert teacher who turns lecture videos into exam-ready study notes for students.

WATCH THE WHOLE VIDEO and use EVERY source of information available:
- Spoken narration / teacher's voice (if any).
- Captions, subtitles, slide text and any text written on screen.
- Visuals: whiteboard or blackboard writing, handwriting, drawings, diagrams, slides, animations, experiments and demonstrations.
Some videos have NO audio or only background music, and NO captions — the lecture is taught only visually. In that case rely completely on what is shown on screen: read the written text, describe the drawings, and follow the steps being demonstrated. Never say you cannot make notes; always produce full notes from whatever the video shows.

${LANGUAGE_RULES[language]}

Fill every field:
- title: the lecture topic. subject: the subject area (e.g. "Physics · Class 11").
- overview: 2-3 sentence summary.
- sourcesUsed: which sources actually carried the content in this video.
- definitions: 4-10 short one-line definitions of the main terms.
- importantPoints: 6-12 important points explained in one or two sentences each.
- keyPoints: 5-10 very short revision bullets (max ~12 words each).
- importantTopics: 3-8 topics covered, each with a 2-4 sentence explanation.
- diagram: one Mermaid diagram that best explains the concept (process flow, hierarchy, cycle or concept map).
  Mermaid rules: start with "flowchart TD"; use simple node ids (A, B, C...); put EVERY label in double quotes like A["Label"]; keep labels short (max 6 words); no parentheses, quotes or special characters outside the label quotes; no markdown fences; 5-12 nodes.
  caption: one sentence explaining the diagram.
- visualNotes: things that were written, drawn or shown on screen (formulas, board work, slide headings, demonstration steps). Empty array only if nothing useful was shown.
- examQuestions: 4-6 likely exam questions with short model answers.`;
}

function friendlyError(status: number, body: string): string {
  let message = "";
  try {
    const parsed = JSON.parse(body);
    message = parsed?.error?.message || parsed?.message || "";
  } catch {
    /* not json */
  }
  if (status === 402) return "AI credits are used up. Please add credits to your workspace and try again.";
  if (status === 429) return "Too many requests right now. Please wait a minute and try again.";
  if (status === 403) return message || "This request was blocked by the AI provider.";
  if (status === 400)
    return "This video couldn't be processed. Make sure it's a public video (not private, age-restricted or members-only) and under about 1 hour long.";
  if (status === 401) return "The AI service isn't configured correctly for this app.";
  return message || "The AI service had a problem. Please try again in a moment.";
}

function cleanMermaid(code: string) {
  return code
    .replace(/^```(?:mermaid)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

function parseNotes(text: string): StudyNotes | null {
  const tryParse = (s: string) => {
    try {
      return JSON.parse(s) as StudyNotes;
    } catch {
      return null;
    }
  };
  let notes = tryParse(text);
  if (!notes) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) notes = tryParse(text.slice(start, end + 1));
  }
  if (!notes || typeof notes !== "object") return null;
  const arr = <T,>(v: T[] | undefined) => (Array.isArray(v) ? v : []);
  return {
    title: notes.title || "Study Notes",
    subject: notes.subject || "",
    overview: notes.overview || "",
    sourcesUsed: arr(notes.sourcesUsed),
    definitions: arr(notes.definitions),
    importantPoints: arr(notes.importantPoints),
    keyPoints: arr(notes.keyPoints),
    importantTopics: arr(notes.importantTopics),
    diagram: {
      title: notes.diagram?.title || "Concept map",
      mermaid: cleanMermaid(notes.diagram?.mermaid || ""),
      caption: notes.diagram?.caption || "",
    },
    visualNotes: arr(notes.visualNotes),
    examQuestions: arr(notes.examQuestions),
  };
}

export async function generateNotesFromVideo(
  videoId: string,
  language: NotesLanguage,
): Promise<NotesResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false, error: "The AI service isn't configured for this app." };

  let response: Response;
  try {
    response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        response_format: {
          type: "json_schema",
          json_schema: { name: "study_notes", strict: true, schema: STUDY_NOTES_SCHEMA },
        },
        messages: [
          { role: "system", content: systemPrompt(language) },
          {
            role: "user",
            content: [
              { type: "text", text: "Create complete study notes for this lecture video." },
              { type: "video_url", video_url: { url: youTubeWatchUrl(videoId) } },
            ],
          },
        ],
      }),
    });
  } catch {
    return { ok: false, error: "Couldn't reach the AI service. Please try again." };
  }

  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => "");
    console.error("AI gateway error", response.status, body.slice(0, 500));
    return { ok: false, error: friendlyError(response.status, body) };
  }

  // Read the streamed answer to the end, then return the finished notes.
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let finishReason: string | null = null;
  let streamError: string | null = null;

  const handleLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") return;
    try {
      const event = JSON.parse(payload);
      if (event.error) {
        streamError = event.error.message || "The AI stopped unexpectedly.";
        return;
      }
      const choice = event.choices?.[0];
      if (choice?.delta?.content) text += choice.delta.content;
      if (choice?.finish_reason) finishReason = choice.finish_reason;
    } catch {
      /* ignore partial frame */
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(handleLine);
  }
  if (buffer) handleLine(buffer);

  if (streamError) return { ok: false, error: streamError };
  if (finishReason === "content_filter" || (!text.trim() && finishReason !== "length")) {
    return {
      ok: false,
      error: "The AI couldn't create notes for this video. Try a different public lecture video.",
    };
  }

  const notes = parseNotes(text);
  if (!notes) {
    return {
      ok: false,
      error:
        finishReason === "length"
          ? "This video is too long to summarise in one go. Try a shorter video (under ~1 hour)."
          : "The notes came back incomplete. Please try again.",
    };
  }
  return { ok: true, notes };
}
