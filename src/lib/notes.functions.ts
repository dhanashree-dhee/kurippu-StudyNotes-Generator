import { createServerFn } from "@tanstack/react-start";
import { extractYouTubeId } from "./youtube";
import { isNotesLanguage, type NotesLanguage, type NotesResult } from "./notes-types";

export const generateStudyNotes = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string; language: NotesLanguage }) => {
    const videoId = extractYouTubeId(String(input?.url ?? ""));
    if (!videoId) throw new Error("Please paste a valid YouTube link.");
    const language: NotesLanguage = isNotesLanguage(input?.language) ? input.language : "english";
    return { videoId, language };
  })
  .handler(async ({ data }): Promise<NotesResult> => {
    const { generateNotesFromVideo } = await import("./notes.server");
    return generateNotesFromVideo(data.videoId, data.language);
  });
