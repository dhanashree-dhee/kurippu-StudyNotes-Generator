export type NotesLanguage = "english" | "tamil" | "tanglish";

export const LANGUAGE_LABELS: Record<NotesLanguage, string> = {
  english: "English",
  tamil: "தமிழ்",
  tanglish: "Tanglish",
};

export type SourceUsed = "speech" | "captions or on-screen text" | "visual demonstration";

export interface StudyNotes {
  title: string;
  subject: string;
  overview: string;
  sourcesUsed: SourceUsed[];
  definitions: { term: string; definition: string }[];
  importantPoints: string[];
  keyPoints: string[];
  importantTopics: { topic: string; explanation: string }[];
  diagram: { title: string; mermaid: string; caption: string };
  visualNotes: string[];
  examQuestions: { question: string; answer: string }[];
}

export type NotesResult = { ok: true; notes: StudyNotes } | { ok: false; error: string };

const str = { type: "string" } as const;
const strArr = { type: "array", items: str } as const;

/** Strict JSON schema the AI must fill in. */
export const STUDY_NOTES_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "subject",
    "overview",
    "sourcesUsed",
    "definitions",
    "importantPoints",
    "keyPoints",
    "importantTopics",
    "diagram",
    "visualNotes",
    "examQuestions",
  ],
  properties: {
    title: str,
    subject: str,
    overview: str,
    sourcesUsed: {
      type: "array",
      items: {
        type: "string",
        enum: ["speech", "captions or on-screen text", "visual demonstration"],
      },
    },
    definitions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["term", "definition"],
        properties: { term: str, definition: str },
      },
    },
    importantPoints: strArr,
    keyPoints: strArr,
    importantTopics: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["topic", "explanation"],
        properties: { topic: str, explanation: str },
      },
    },
    diagram: {
      type: "object",
      additionalProperties: false,
      required: ["title", "mermaid", "caption"],
      properties: { title: str, mermaid: str, caption: str },
    },
    visualNotes: strArr,
    examQuestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "answer"],
        properties: { question: str, answer: str },
      },
    },
  },
} as const;

export function notesToMarkdown(n: StudyNotes): string {
  const lines: string[] = [];
  lines.push(`# ${n.title}`, `_${n.subject}_`, "", n.overview, "");
  if (n.definitions.length) {
    lines.push("## Short Definitions");
    n.definitions.forEach((d) => lines.push(`- **${d.term}:** ${d.definition}`));
    lines.push("");
  }
  if (n.importantPoints.length) {
    lines.push("## Important Points");
    n.importantPoints.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
  }
  if (n.keyPoints.length) {
    lines.push("## Key Points");
    n.keyPoints.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
  }
  if (n.importantTopics.length) {
    lines.push("## Important Topics");
    n.importantTopics.forEach((t) => lines.push(`### ${t.topic}`, t.explanation, ""));
  }
  lines.push(`## Diagram: ${n.diagram.title}`, "```mermaid", n.diagram.mermaid, "```", "");
  if (n.visualNotes.length) {
    lines.push("## From the Screen");
    n.visualNotes.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
  }
  if (n.examQuestions.length) {
    lines.push("## Exam Questions");
    n.examQuestions.forEach((q, i) => lines.push(`${i + 1}. **${q.question}**`, `   ${q.answer}`));
  }
  return lines.join("\n");
}
