import { describe, expect, it } from "vitest";
import { LANGUAGES, getLanguage, isNotesLanguage } from "@/lib/notes-types";

describe("notes languages", () => {
  it("offers the common Indian languages", () => {
    const ids = LANGUAGES.map((l) => l.id);
    for (const id of ["english", "hindi", "tamil", "telugu", "kannada", "malayalam", "marathi", "bengali", "gujarati", "punjabi", "odia", "urdu"]) {
      expect(ids).toContain(id);
    }
  });
  it("rejects unknown languages", () => {
    expect(isNotesLanguage("klingon")).toBe(false);
    expect(isNotesLanguage("hindi")).toBe(true);
  });
  it("writes Urdu right-to-left", () => {
    expect(getLanguage("urdu")?.rtl).toBe(true);
  });
});
