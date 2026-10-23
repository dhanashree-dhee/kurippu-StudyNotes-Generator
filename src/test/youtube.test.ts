import { describe, expect, it } from "vitest";
import { extractYouTubeId } from "@/lib/youtube";

describe("extractYouTubeId", () => {
  it("reads normal watch links", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=jNQXAC9IVRw&t=30s")).toBe("jNQXAC9IVRw");
  });
  it("reads short youtu.be links", () => {
    expect(extractYouTubeId("https://youtu.be/jNQXAC9IVRw?si=abc")).toBe("jNQXAC9IVRw");
  });
  it("reads shorts, live and mobile links", () => {
    expect(extractYouTubeId("youtube.com/shorts/jNQXAC9IVRw")).toBe("jNQXAC9IVRw");
    expect(extractYouTubeId("https://www.youtube.com/live/jNQXAC9IVRw")).toBe("jNQXAC9IVRw");
    expect(extractYouTubeId("https://m.youtube.com/watch?v=jNQXAC9IVRw")).toBe("jNQXAC9IVRw");
  });
  it("rejects non-YouTube links", () => {
    expect(extractYouTubeId("https://vimeo.com/123456")).toBeNull();
    expect(extractYouTubeId("hello")).toBeNull();
  });
});
