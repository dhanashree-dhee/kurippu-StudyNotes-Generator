export interface LanguageOption {
  id: string;
  /** Name in its own script, shown on the button */
  native: string;
  /** English name, shown under it */
  english: string;
  /** Instruction given to the AI */
  rule: string;
  rtl?: boolean;
}

const nativeScript = (name: string, script: string, example: string) =>
  `Write all notes in ${name} using ${script} script. Keep technical/scientific terms in English inside brackets after the ${name} word, e.g. ${example}.`;

const romanised = (name: string, example: string) =>
  `Write all notes in ${name} — ${name.replace(/lish$/, "")} language written using English (Roman) letters, the way students text (e.g. '${example}'). Keep technical terms in English.`;

export const LANGUAGES = [
  { id: "english", native: "English", english: "English", rule: "Write all notes in clear, simple English." },
  { id: "hindi", native: "हिन्दी", english: "Hindi", rule: nativeScript("Hindi", "Devanagari", "प्रकाश संश्लेषण (Photosynthesis)") },
  { id: "tamil", native: "தமிழ்", english: "Tamil", rule: nativeScript("Tamil", "Tamil", "ஒளிச்சேர்க்கை (Photosynthesis)") },
  { id: "telugu", native: "తెలుగు", english: "Telugu", rule: nativeScript("Telugu", "Telugu", "కిరణజన్య సంయోగక్రియ (Photosynthesis)") },
  { id: "kannada", native: "ಕನ್ನಡ", english: "Kannada", rule: nativeScript("Kannada", "Kannada", "ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ (Photosynthesis)") },
  { id: "malayalam", native: "മലയാളം", english: "Malayalam", rule: nativeScript("Malayalam", "Malayalam", "പ്രകാശസംശ്ലേഷണം (Photosynthesis)") },
  { id: "marathi", native: "मराठी", english: "Marathi", rule: nativeScript("Marathi", "Devanagari", "प्रकाशसंश्लेषण (Photosynthesis)") },
  { id: "bengali", native: "বাংলা", english: "Bengali", rule: nativeScript("Bengali", "Bengali", "সালোকসংশ্লেষণ (Photosynthesis)") },
  { id: "gujarati", native: "ગુજરાતી", english: "Gujarati", rule: nativeScript("Gujarati", "Gujarati", "પ્રકાશસંશ્લેષણ (Photosynthesis)") },
  { id: "punjabi", native: "ਪੰਜਾਬੀ", english: "Punjabi", rule: nativeScript("Punjabi", "Gurmukhi", "ਪ੍ਰਕਾਸ਼ ਸੰਸ਼ਲੇਸ਼ਣ (Photosynthesis)") },
  { id: "odia", native: "ଓଡ଼ିଆ", english: "Odia", rule: nativeScript("Odia", "Odia", "ଆଲୋକଶ୍ଳେଷଣ (Photosynthesis)") },
  { id: "assamese", native: "অসমীয়া", english: "Assamese", rule: nativeScript("Assamese", "Assamese (Bengali-Assamese)", "সালোকসংশ্লেষণ (Photosynthesis)") },
  { id: "urdu", native: "اردو", english: "Urdu", rule: nativeScript("Urdu", "Urdu (Perso-Arabic, Nastaliq)", "ضیائی تالیف (Photosynthesis)"), rtl: true },
  { id: "hinglish", native: "Hinglish", english: "Hindi in English letters", rule: romanised("Hinglish", "Yeh bahut important concept hai") },
  { id: "tanglish", native: "Tanglish", english: "Tamil in English letters", rule: romanised("Tanglish", "Ithu romba important concept") },
] as const satisfies readonly LanguageOption[];

export type NotesLanguage = (typeof LANGUAGES)[number]["id"];

export function getLanguage(id: string): LanguageOption | undefined {
  return (LANGUAGES as readonly LanguageOption[]).find((l) => l.id === id);
}

export function isNotesLanguage(id: unknown): id is NotesLanguage {
  return typeof id === "string" && !!getLanguage(id);
}

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
